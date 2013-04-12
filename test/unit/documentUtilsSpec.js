describe('documentUtils', function() {
    var documentUtils, global,
        ie = testutils.browser.ie;
    beforeEach(function() {
        global = {
        };
        documentUtils = uitest.require({
            global: global
        }, ["documentUtils"]).documentUtils;
    });

    describe('serializeDocType', function() {
        function doctype(html) {
            return documentUtils.serializeDocType(testutils.createFrame(html).win.document);
        }
        it('should return empty string if no doctype is given', function() {
            expect(doctype('<html></html>')).toBe('');
        });
        if (!ie) {
            // For IE7...
            it('should serialize html5 doctype', function() {
                expect(doctype('<!DOCTYPE html><html></html>')).toBe('<!DOCTYPE html>');
            });
        }
    });

    describe('loadAndEvalScriptSync', function() {
        var xhr, win;
        beforeEach(function() {
            xhr = {
                open: jasmine.createSpy('open'),
                send: jasmine.createSpy('send')
            };
            win = {
                XMLHttpRequest: jasmine.createSpy('xhr').andReturn(xhr),
                "eval": jasmine.createSpy('eval')
            };
        });

        function simulateXhrResponse(response) {
            xhr.readyState = 4;
            xhr.status = 200;
            xhr.responseText = response;
            xhr.onreadystatechange();
        }
        function simulateFileXhrResponse(response) {
            xhr.readyState = 4;
            xhr.status = 0;
            xhr.responseText = response;
            xhr.onreadystatechange();
        }
        it('should use a sync xhr', function() {
            documentUtils.loadAndEvalScriptSync(win, 'someUrl');
            expect(xhr.open).toHaveBeenCalledWith('GET', 'someUrl', false);
            expect(xhr.send).toHaveBeenCalled();
        });
        it('should call eval with the xhr result', function() {
            /*jshint evil:true */
            documentUtils.loadAndEvalScriptSync(win, 'someUrl');
            simulateXhrResponse('someResponse');
            expect(win['eval']).toHaveBeenCalledWith('someResponse//@ sourceURL=someUrl');
        });
        it('should work with file based xhr', function() {
            /*jshint evil:true */
            documentUtils.loadAndEvalScriptSync(win, 'someUrl');
            simulateFileXhrResponse('someResponse');
            expect(win['eval']).toHaveBeenCalled();
        });
        it('should allow the preProcessCalback to change the xhr result', function() {
            /*jshint evil:true */
            var preProcessCalback = jasmine.createSpy('preProcessCalback');
            preProcessCalback.andReturn('someProcessedResponse');
            documentUtils.loadAndEvalScriptSync(win, 'someUrl', preProcessCalback);
            simulateXhrResponse('someResponse');
            expect(win['eval']).toHaveBeenCalledWith('someProcessedResponse');
        });
    });

    describe('makeEmptyTagsToOpenCloseTags', function() {
        it('should unpack empty tags', function() {
            var html = '<html a="b"><closed/><closed2 c="d"/></html>';
            html = documentUtils.makeEmptyTagsToOpenCloseTags(html);
            expect(html).toBe('<html a="b"><closed></closed><closed2 c="d"></closed2></html>');
        });
    });
});