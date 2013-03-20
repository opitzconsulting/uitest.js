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

    describe('replaceScripts', function() {
        var callback;
        beforeEach(function() {
            callback = jasmine.createSpy('callback');
        });
        it('should replace url scripts', function() {
            var someReplacement = 'someReplacement';
            callback.andReturn(someReplacement);
            var result = documentUtils.replaceScripts('<script src="a"></script>', callback);
            expect(callback.callCount).toBe(1);
            expect(callback).toHaveBeenCalledWith({match: '<script src="a"></script>',scriptOpenTag: '<script src="a">', srcAttribute: 'src="a"', scriptUrl: 'a', textContent: ''});
        });
        it('should replace inline scripts', function() {
            var someReplacement = 'someReplacement';
            callback.andReturn(someReplacement);
            var result = documentUtils.replaceScripts('<script>a</script>', callback);
            expect(callback.callCount).toBe(1);
            expect(callback).toHaveBeenCalledWith({match: '<script>a</script>', scriptOpenTag: '<script>', srcAttribute: '', scriptUrl: '', textContent: 'a'});
        });
        it('should replace scripts if the result is not undefined', function() {
            var someReplacement = 'someReplacement';
            callback.andReturn(someReplacement);
            expect(documentUtils.replaceScripts('<script>a</script>', callback)).toBe(someReplacement);
        });
        it('should not replace scripts if the result is undefined', function() {
            var input = '<script>a</script>';
            expect(documentUtils.replaceScripts(input, callback)).toBe(input);
        });
        it('should replace multiple inline scripts', function() {
            documentUtils.replaceScripts('<script>a</script><script>b</script>', callback);
            expect(callback.callCount).toBe(2);
            expect(callback.argsForCall[0]).toEqual([{match: '<script>a</script>', scriptOpenTag: '<script>',srcAttribute: '', scriptUrl: '', textContent: 'a'}]);
            expect(callback.argsForCall[1]).toEqual([{match: '<script>b</script>', scriptOpenTag: '<script>',srcAttribute: '', scriptUrl: '', textContent: 'b'}]);
        });
        it('should replace multi line inline scripts', function() {
            var content = 'a\r\nb';
            documentUtils.replaceScripts('<script>' + content + '</script>', callback);
            expect(callback).toHaveBeenCalledWith({match: '<script>' + content + '</script>', scriptOpenTag: '<script>', srcAttribute: '', scriptUrl: '', textContent: content});
        });
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