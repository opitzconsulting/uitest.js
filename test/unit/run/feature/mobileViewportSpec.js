describe('run/feature/mobileViewport', function() {
    var testframe, runConfig, win, newMetaElement, metaTags = [], topMetaTags = [];
    beforeEach(function() {
        newMetaElement = {
            setAttribute: jasmine.createSpy('setAttribute')
        };
        win = {
            top: {
                document: {
                    getElementsByTagName: jasmine.createSpy('getElementsByTagName').andReturn(topMetaTags),
                    createElement: jasmine.createSpy('createElement').andReturn(newMetaElement),
                    head: {
                        appendChild: jasmine.createSpy('appendChild')
                    }
                }
            },
            document: {
                getElementsByTagName: jasmine.createSpy('getElementsByTagName').andReturn(metaTags)
            }
        };

        runConfig = {
            appends: []
        };
        uitest.require({
            "run/config": runConfig
        },["run/feature/mobileViewport"]);
    });
    function createElementSpy(attrs) {
        return {
            getAttribute: function(attrName) {
                return attrs[attrName];
            },
            parentNode: {
                removeChild: jasmine.createSpy('removeChild')
            }
        };
    }

    it('should copy the meta tag from the testframe to the top frame with an append call', function() {
        metaTags.push(createElementSpy({name: 'someMeta'}));
        metaTags.push(createElementSpy({name: 'viewport', content: 'someContent'}));

        runConfig.appends[0](win);
        var doc = win.document;
        var topDoc = win.top.document;
        expect(doc.getElementsByTagName).toHaveBeenCalledWith("meta");
        expect(topDoc.createElement).toHaveBeenCalledWith("meta");
        expect(topDoc.head.appendChild).toHaveBeenCalledWith(newMetaElement);
        expect(newMetaElement.setAttribute).toHaveBeenCalledWith("name", "viewport");
        expect(newMetaElement.setAttribute).toHaveBeenCalledWith("content", "someContent");
    });

    it('should remove an existing meta tag from the top frame', function() {
        topMetaTags.push(createElementSpy({name: 'someMeta'}));
        topMetaTags.push(createElementSpy({name: 'viewport', content: 'someContent'}));

        runConfig.appends[0](win);
        var doc = win.document;
        var topDoc = win.top.document;
        expect(topDoc.getElementsByTagName).toHaveBeenCalledWith("meta");
        expect(topMetaTags[0].parentNode.removeChild).not.toHaveBeenCalled();
        expect(topMetaTags[1].parentNode.removeChild).toHaveBeenCalledWith(topMetaTags[1]);
    });
});
