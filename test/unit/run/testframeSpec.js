describe('run/testframe', function() {
    var global, body, topFrame, iframeElement, uitestwindow, buttonElement, injector, runSniffer, scriptElement;
    beforeEach(function() {
        scriptElement = {
            setAttribute: jasmine.createSpy('setAttribute')
        };
        uitestwindow = {
            location: {},
            close: jasmine.createSpy('close'),
            document: {
                createElement: jasmine.createSpy('createElement').andReturn(scriptElement),
                body: {
                    appendChild: jasmine.createSpy('appendChild')
                }
            }
        };
        body = {
            appendChild: jasmine.createSpy('appendChild'),
            removeChild: jasmine.createSpy('removeChild'),
            style: {}
        };
        buttonElement = {
            setAttribute: jasmine.createSpy('setAttribute'),
            addEventListener: jasmine.createSpy('addEventListener'),
            style: {}
        };
        iframeElement = {
            setAttribute: jasmine.createSpy('setAttribute'),
            parentElement: body,
            contentWindow: uitestwindow,
            style: {}
        };
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
            Date: {
                now: jasmine.createSpy('now').andReturn(123)
            },
            uitest: {},
            document: {
                getElementsByTagName: jasmine.createSpy('getElementsByTagName').andReturn([{
                    src: 'uitest.js'
                }])
            }
        };
        injector = {
            addDefaultResolver: jasmine.createSpy('addDefaultResolver')
        };
        runSniffer = {};
    });

    function createTestframe(url) {
        url = url || '/someUrl';

        var modules = uitest.require({
            global: global,
            "run/config": {
                url: url
            },
            "run/injector": injector,
            "run/sniffer": runSniffer
        }, ["run/testframe", "utils"]);
        return modules["run/testframe"];
    }

    function realSniffer(finishedCallback) {
        var sniffer = uitest.require({
            global: window
        }, ["sniffer"]).sniffer;
        sniffer(finishedCallback);
    }

    it('should publish the uitest module to the top frame', function() {
        createTestframe();
        expect(global.top.uitest).toBe(global.uitest);
    });
    it('should register itself as default resolver at the injector', function() {
        var testframe = createTestframe();
        expect(injector.addDefaultResolver).toHaveBeenCalled();
        testframe.win = function() { return {x: 'y' }; };
        expect(injector.addDefaultResolver.mostRecentCall.args[0]('x')).toBe('y');
    });
    it('should create an iframe in the top frame on first module creation', function() {
        var testframe = createTestframe();
        expect(body.appendChild).toHaveBeenCalledWith(iframeElement);
        expect(iframeElement.setAttribute).toHaveBeenCalledWith("id", "uitestwindow");
        expect(testframe.win()).toBe(uitestwindow);
    });
    it('should reuse an existing iframe in the top frame by its id', function() {
        topFrame.document.getElementById.andReturn(iframeElement);
        var testframe = createTestframe();
        expect(body.appendChild).not.toHaveBeenCalled();
        expect(testframe.win()).toBe(uitestwindow);
    });
    describe('set the location.href on the first call', function() {
        it('works for absolute urls', function() {
            createTestframe('/someUrl');
            expect(uitestwindow.location.href).toBe("/someUrl?123");
        });
        it('adds the url of uitest.js for relative urls', function() {
            global.document.getElementsByTagName.andReturn([{src: 'someScript.js'}, {src:'/base/uitest.js'}]);
            createTestframe('someUrl');
            expect(uitestwindow.location.href).toBe("/base/someUrl?123");
        });
    });
    it('should set the location.href on further calls', function() {
        createTestframe();
        expect(uitestwindow.location.href).toBe("/someUrl?123");
    });
    it('should replace {now} in the url with the value used for cacheBusting', function() {
        createTestframe('someUrl?check={now}');
        expect(uitestwindow.location.href).toBe("/someUrl?check=123&123");
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

    describe('rewriteDocument', function() {
        it('should reset all previously existing globals', function() {
            var win;
            // Note: We need to use the real sniffer here,
            // as not all strategies for rewriting work on all browsers!
            runSniffer = null;
            runs(function() {
                realSniffer(function(_runSniffer) {
                    runSniffer = _runSniffer;
                });
            });
            waitsFor(function() {
                return runSniffer;
            });
            runs(function() {
                var testframe = createTestframe();
                global.top = window.top;
                win = testutils.createFrame('<html></html>').win;
                win.a = 1;
                testframe.win = function() {
                    return win;
                };
                testframe.rewriteDocument('<html></html>');
            });
            waits(100);
            runs(function() {
                expect(win.a).toBeUndefined();
            });
        });

        it('should use a js url if the browser supports it', function() {
            var html = '<html></html>';
            runSniffer.jsUrl = true;
            var testframe = createTestframe();
            testframe.rewriteDocument(html);
            /*jshint scripturl:true*/
            expect(uitestwindow.location.href).toBe('javascript:window.top.newContent');
            expect(topFrame.newContent).toBe(html);
        });

        it('should use document.open/write/close if the browser does not support js urls', function() {
            var html = '<html></html>';
            runSniffer.jsUrl = false;
            var testframe = createTestframe();
            var oldUrl = uitestwindow.location.href;
            testframe.rewriteDocument(html);
            expect(uitestwindow.location.href).toBe(oldUrl);
            expect(uitestwindow.document.createElement).toHaveBeenCalledWith('script');
            expect(uitestwindow.document.body.appendChild).toHaveBeenCalledWith(scriptElement);
            expect(scriptElement.textContent.length>0).toBe(true);
        });
    });

});