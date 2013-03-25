describe('run/instrumentor', function() {
    var instrumentor, frame, documentUtils, config, global, require,
        testframe, sniffer;

    beforeEach(function() {
        config = {
        };
        require = jasmine.createSpy('require');
        global = {
            Array: Array
        };
        testframe = {
            win: {},
            rewriteDocument: jasmine.createSpy('rewriteDocument')
        };
        sniffer = {
            browser: testutils.browser
        };
        var modules = uitest.require({
            "run/config": config,
            "run/testframe": testframe,
            "run/sniffer": sniffer,
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
        });
        it('should call deactivateAndCaptureHtml, the preprocessors, expand empty tags and then rewriteDocument', function() {
            var someInitialHtml = 'someInitialHtml',
                preproc1 = jasmine.createSpy("preproc1").andReturn("preproc1Html"),
                preproc2 = jasmine.createSpy("preproc1").andReturn("preproc2Html<emptyTag/>");

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
            expect(testframe.rewriteDocument).toHaveBeenCalledWith("preproc2Html<emptyTag></emptyTag>");
        });
        it('should make it global', function() {
            expect(global.uitest.instrument).toBe(instrumentor.internal.instrument);
        });
    });

    describe('deactivateAndCaptureHtml', function() {
        var html, deactivateAndCaptureHtml;

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
                        html = _html.replace(/[<\/]([A-Z]*)/g, function(match) {
                            return match.toLowerCase();
                        });
                        html = html.replace(/[\n\r]/g, "");
                    });
                };
                testutils.createFrame(prefix + '<script>parent.tmp()</script>' + suffix);
            });
            waitsFor(function() {
                return html;
            }, 200);
            // for the document rewrite...
            waits(20);
        }

        it('should give the html without the calling script to the callback', function() {
            var prefix = '<html><head><meta>',
                suffix = '</head><body>someBody</body></html>';
            init(prefix, suffix);
            runs(function() {
                expect(html).toBe(prefix + suffix);
            });
        });

        if (!testutils.browser.android) {
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
            it('should not allow to create new globals after a doc rewrite', function() {
                // Note:
                // In IE7, global variables that are declared using "var" cannot be
                // detected generically. However, IE7 does clear all global variables
                // itself on a call to document.open, which we always do after deactivateAndCaptureHtml!
                var prefix = '<html><head>',
                    suffix = '<script>var someGlobalVar; someGlobalVar = someGlobalVar?someGlobalVar+1:0;window.someFlag = window.someFlag?window.someFlag+1:0;</script></head></html>';
                init(prefix, suffix);
                runs(function() {
                    var doc = testutils.frame.win.document;
                    doc.open();
                    doc.write(html);
                    doc.close();
                });
                waits(10);
                runs(function() {
                    expect(testutils.frame.win.someFlag).toBe(0);
                    expect(testutils.frame.win.someGlobalVar).toBe(0);
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
                window.someTimeoutFlag = false;
                var prefix = '<html><head></head><body>',
                    suffix = '<script>setTimeout(function() { parent.someTimeoutFlag = true; },0);</script></body></html>';
                init(prefix, suffix);
                waits(20);
                runs(function() {
                    expect(window.someTimeoutFlag).toBe(false);
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
