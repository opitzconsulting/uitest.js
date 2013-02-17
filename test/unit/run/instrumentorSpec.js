describe('run/instrumentor', function() {
    var instrumentor, frame, documentUtils, config, global, require;
    beforeEach(function() {
        config = {
        };
        require = jasmine.createSpy('require');
        global = {
            Array: Array
        };
        var modules = uitest.require({
            "run/config": config,
            global: global
     }, ["run/instrumentor", "documentUtils"]);
        documentUtils = modules.documentUtils;
        instrumentor = modules["run/instrumentor"];
        spyOn(documentUtils, 'loadAndEvalScriptSync');
        spyOn(documentUtils, 'loadFile');
    });

    describe('instrument', function() {
        var win = {
            a: 1
        };
        beforeEach(function() {
            config.b = 2;
            spyOn(instrumentor.internal, 'deactivateAndCaptureHtml');
            spyOn(instrumentor.internal, 'rewriteDocument');
        });
        it('should call deactivateAndCaptureHtml, the preprocessors, and then rewriteDocument', function() {
            var someInitialHtml = 'someInitialHtml',
                someBrowserFlags = {
                    a: 1
                },
                preproc1 = jasmine.createSpy("preproc1").andReturn("preproc1Html"),
                preproc2 = jasmine.createSpy("preproc1").andReturn("preproc2Html");

            instrumentor.addPreprocessor(0, preproc2);
            instrumentor.addPreprocessor(100, preproc1);

            instrumentor.internal.deactivateAndCaptureHtml.andCallFake(function(win, callback) {
                callback(someInitialHtml, someBrowserFlags);
            });

            instrumentor.internal.instrument(win);

            expect(instrumentor.internal.deactivateAndCaptureHtml).toHaveBeenCalled();
            expect(instrumentor.internal.deactivateAndCaptureHtml.mostRecentCall.args[0]).toBe(win);
            expect(preproc1).toHaveBeenCalledWith(someInitialHtml, someBrowserFlags);
            expect(preproc2).toHaveBeenCalledWith("preproc1Html", someBrowserFlags);
            expect(instrumentor.internal.rewriteDocument).toHaveBeenCalledWith(win, "preproc2Html");
        });
        it('should make it global', function() {
            expect(global.uitest.instrument).toBe(instrumentor.internal.instrument);
        });
    });
    
    describe('deactivateAndCaptureHtml', function() {
        var html;

        beforeEach(function() {
            documentUtils.loadFile.andCallFake(function(win, url, async, callback) {
                callback(null, 'someHtmlLoadedViaXhr');
            });
        });

        function init(prefix, suffix) {
            html = '';

            runs(function() {
                window.tmp = function() {
                    instrumentor.internal.deactivateAndCaptureHtml(testutils.frame.win, function(_html) {
                        html = _html;
                    });
                };
                testutils.createFrame(prefix + '<script>parent.tmp()</script>' + suffix);
            });
            waitsFor(function() {
                return html;
            }, 200);
        }

        var android = /android/i.test(window.navigator.userAgent.toLowerCase());
        if (!android) {
            describe('not on android', function() {
                // Here we want to enforce that the <noscript> tag works at least
                // on some browsers!
                // That deactivateAndCaptureHtml also works on android devices
                // is proofed by the ui tests!
                it('should give the html without the calling script to the callback', function() {
                    var prefix = '<html><head>',
                        suffix = '</head></html>';
                    init(prefix, suffix);
                    runs(function() {
                        expect(html).toBe(prefix + suffix);
                    });
                });
            });
        }

        it('should load the html using the noscript hack or xhr if the noscript hack did not work', function() {
            var prefix = '<html><head>',
                suffix = '</head></html>';
            init(prefix, suffix);
            runs(function() {
                expect(html===prefix+suffix || html==='someHtmlLoadedViaXhr').toBe(true);
            });
        });

        it('should not execute scripts after it', function() {
            var prefix = '<html><head>',
                suffix = '<script>window.test=true;</script></head></html>';
            init(prefix, suffix);
            runs(function() {
                expect(testutils.frame.win.test).toBeUndefined();
            });
        });
    });

    describe('rewriteDocument', function() {
        function rewrite(html) {
            var frame = testutils.createFrame('<html></html>').win;
            instrumentor.internal.rewriteDocument(frame, html);
            return frame.document;
        }
        it('should replace the document, including the root element and doctype', function() {
            var doc;
            runs(function() {
                doc = rewrite('<!DOCTYPE html><html test="true"></html>');
            });
            waits(20);
            runs(function() {
                expect(doc.documentElement.getAttribute("test")).toBe("true");
                expect(doc.doctype.name).toBe('html');
            });
        });
    });

    describe('createRemoteCallExpression', function() {
        it('should register the callback in the internal array', function() {
            var cb = jasmine.createSpy();
            instrumentor.createRemoteCallExpression(cb);
            expect(instrumentor.internal.instrument.callbacks[0]).toBe(cb);
        });
        it('should create a js expression with the given arguments', function() {
            var cb = jasmine.createSpy();
            expect(instrumentor.createRemoteCallExpression(cb, 'window')).toBe('parent.uitest.instrument.callbacks[0](window);');
        });
    });

});
