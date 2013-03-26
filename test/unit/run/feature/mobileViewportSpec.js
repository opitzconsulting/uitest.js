describe('run/feature/mobileViewport', function() {
    var testframe, runConfig, win, newMetaElement, metaTags = [], topMetaTags = [],
        headElement, top;
    beforeEach(function() {
        newMetaElement = {
            setAttribute: jasmine.createSpy('setAttribute')
        };
        headElement = {
            appendChild: jasmine.createSpy('appendChild')
        };
        top = {
                document: {
                    getElementsByTagName: jasmine.createSpy('getElementsByTagName').andCallFake(function(tagName) {
                        if (tagName==='meta') {
                            return topMetaTags;
                        } else if(tagName==='head') {
                            return [headElement];
                        }
                    }),
                    createElement: jasmine.createSpy('createElement').andReturn(newMetaElement),
                    head: headElement
                }
            };
        win = {
            document: {
                getElementsByTagName: jasmine.createSpy('getElementsByTagName').andReturn(metaTags)
            }
        };

        runConfig = {
            appends: []
        };
        uitest.require({
            top: top,
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
        var topDoc = top.document;
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
        var topDoc = top.document;
        expect(topDoc.getElementsByTagName).toHaveBeenCalledWith("meta");
        expect(topMetaTags[0].parentNode.removeChild).not.toHaveBeenCalled();
        expect(topMetaTags[1].parentNode.removeChild).toHaveBeenCalledWith(topMetaTags[1]);
    });
});
