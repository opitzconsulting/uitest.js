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
                preproc1 = jasmine.createSpy("preproc1").andReturn("preproc1Html"),
                preproc2 = jasmine.createSpy("preproc1").andReturn("preproc2Html");

            instrumentor.addPreprocessor(0, preproc2);
            instrumentor.addPreprocessor(100, preproc1);

            instrumentor.internal.deactivateAndCaptureHtml.andCallFake(function(win, callback) {
                callback(someInitialHtml);
            });

            instrumentor.internal.instrument(win);

            expect(instrumentor.internal.deactivateAndCaptureHtml).toHaveBeenCalled();
            expect(instrumentor.internal.deactivateAndCaptureHtml.mostRecentCall.args[0]).toBe(win);
            expect(preproc1).toHaveBeenCalledWith(someInitialHtml);
            expect(preproc2).toHaveBeenCalledWith("preproc1Html");
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

        it('should give the html without the calling script to the callback', function() {
            var prefix = '<html><head><meta name="someHeadMeta">',
                suffix = '</head><body>someBody</body></html>';
            init(prefix, suffix);
            runs(function() {
                expect(html).toBe(prefix + suffix);
            });
        });

        var android = /android/i.test(window.navigator.userAgent.toLowerCase());
        var ie = /MSIE/i.test(window.navigator.userAgent.toLowerCase());

        if (!android && !ie) {
            describe('not on android and not on ie', function() {
                // Here we want to enforce that our html capture and script deactivation
                // works at least on some browsers without workarounds.
                it('should not execute scripts', function() {
                    window.someFlag = false;
                    var prefix = '<html><head>',
                        suffix = '<script>parent.someFlag = true;</script></head></html>';
                    init(prefix, suffix);
                    runs(function() {
                        expect(window.someFlag).toBe(false);
                    });
                });
            });
        }

        describe('if scripts are executed', function() {
            it('should not allow to create new globals', function() {
                var prefix = '<html><head>',
                    suffix = '<script>var someGlobalVar = true; window.someFlag = true;</script></head></html>';
                init(prefix, suffix);
                runs(function() {
                    expect(testutils.frame.win.someFlag).toBeUndefined();
                    expect(testutils.frame.win.someGlobalVar).toBeUndefined();
                });
            });
            it('should not be able to modify the DOM using document.write/writeln', function() {
                var prefix = '<html><head></head><body>',
                    suffix = '<script>document.write("test");document.writeln("test2");</script></body></html>';
                init(prefix, suffix);
                runs(function() {
                    expect(html).toBe(prefix+suffix);
                });
            });
            it('should not be able to modify the DOM using DOM-API', function() {
                var prefix = '<html><head></head><body>',
                    suffix = '<script>document.body.appendChild(document.createElement("DIV"));</script></body></html>';
                init(prefix, suffix);
                runs(function() {
                    expect(html).toBe(prefix+suffix);
                });
            });
            it('should not be able to install setTimeouts', function() {
                window.someFlag = false;
                var prefix = '<html><head></head><body>',
                    suffix = '<script>setTimeout(function() { parent.someFlag = true; },0);</script></body></html>';
                init(prefix, suffix);
                waits(20);
                runs(function() {
                    expect(window.someFlag).toBe(false);
                });
            });
            it('should not be able to install setIntervals', function() {
                window.someFlag = false;
                var prefix = '<html><head></head><body>',
                    suffix = '<script>setInterval(function() { parent.someFlag = true; },2);</script></body></html>';
                init(prefix, suffix);
                waits(20);
                runs(function() {
                    expect(window.someFlag).toBe(false);
                });
            });
            it('should not be able to execute xhrs', function() {
                window.someFlag = false;
                var prefix = '<html><head></head><body>',
                    suffix = '<script>var xhr = new XMLHttpRequest();xhr.open("GET", "someUrl", false);xhr.onreadystatechange = function() { parent.someFlag = xhr; };xhr.send();</script></body></html>';
                init(prefix, suffix);
                waits(20);
                runs(function() {
                    expect(window.someFlag).toBe(false);
                });

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
