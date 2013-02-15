describe('run/testframe', function() {
    var global, body, topFrame, iframeElement, uitestwindow, buttonElement, injector, someNow;
    beforeEach(function() {
        uitestwindow = {
            location: {},
            close: jasmine.createSpy('close')
        };
        body = {
            appendChild: jasmine.createSpy('appendChild'),
            removeChild: jasmine.createSpy('removeChild'),
            style: {}
        };
        buttonElement = {
            setAttribute: jasmine.createSpy('setAttribute'),
            addEventListener: jasmine.createSpy('addEventListener')
        };
        iframeElement = {
            setAttribute: jasmine.createSpy('setAttribute'),
            parentElement: body,
            contentWindow: uitestwindow,
            style: {}
        };
        someNow = 1234;
        topFrame = {
            document: {
                body: body,
                createElement: jasmine.createSpy('createElement').andCallFake(function(elemName) {
                    if(elemName === 'iframe') {
                        return iframeElement;
                    } else if(elemName === 'button') {
                        return buttonElement;
                    }
                }),
                getElementById: jasmine.createSpy('getElementById')
            }
        };
        global = {
            top: topFrame,
            uitest: {},
            Date: {
                now:jasmine.createSpy("now").andReturn(someNow)
            },
            document: {
                getElementsByTagName: jasmine.createSpy('getElementsByTagName').andReturn([{
                    src: 'uitest.js'
                }])
            }
        };
        injector = {
            addDefaultResolver: jasmine.createSpy('addDefaultResolver')
        };
    });

    function createTestframe(url) {
        url = url || '/someUrl';
        return uitest.require({
            global: global,
            "run/config": {
                url: url
            },
            "run/injector": injector
        }, ["run/testframe"])["run/testframe"];
    }

    it('should publish the uitest module to the top frame', function() {
        createTestframe();
        expect(global.top.uitest).toBe(global.uitest);
    });
    it('should register itself as default resolver at the injector', function() {
        var testframe = createTestframe();
        expect(injector.addDefaultResolver).toHaveBeenCalledWith(testframe);
    });
    it('should create an iframe in the top frame on first module creation', function() {
        var testframe = createTestframe();
        expect(body.appendChild).toHaveBeenCalledWith(iframeElement);
        expect(iframeElement.setAttribute).toHaveBeenCalledWith("id", "uitestwindow");
        expect(testframe).toBe(uitestwindow);
    });
    it('should reuse an existing iframe in the top frame by its id', function() {
        topFrame.document.getElementById.andReturn(iframeElement);
        var testframe = createTestframe();
        expect(body.appendChild).not.toHaveBeenCalled();
        expect(testframe).toBe(uitestwindow);
    });
    describe('set the location.href on the first call', function() {
        it('works for absolute urls', function() {
            createTestframe('/someUrl');
            expect(uitestwindow.location.href).toBe("/someUrl?uitr="+someNow);
        });
        it('adds the url of uitest.js for relative urls', function() {
            global.document.getElementsByTagName.andReturn([{src: 'someScript.js'}, {src:'/base/uitest.js'}]);
            createTestframe('someUrl');
            expect(uitestwindow.location.href).toBe("/base/someUrl?uitr="+someNow);
        });
    });
    it('should set the location.href on further calls', function() {
        createTestframe();
        expect(uitestwindow.location.href).toBe("/someUrl?uitr="+someNow);
    });
    describe('toggleButton', function() {
        it('should create a button', function() {
            createTestframe();
            expect(topFrame.document.createElement).toHaveBeenCalledWith("button");
            expect(topFrame.document.body.appendChild).toHaveBeenCalledWith(buttonElement);
        });
        it('should toggle the zIndex from -100 to +100', function() {
            createTestframe();
            expect(iframeElement.style.zIndex).toBe(100);
            buttonElement.addEventListener.mostRecentCall.args[1]();
            expect(iframeElement.style.zIndex).toBe(-100);
            buttonElement.addEventListener.mostRecentCall.args[1]();
            expect(iframeElement.style.zIndex).toBe(100);
        });
    });
});