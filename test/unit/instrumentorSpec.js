describe('instrumentor', function() {
    var instrumentor, frame, documentUtils;
    beforeEach(function() {
        var modules = uitest.require(["instrumentor", "documentUtils"]);
        documentUtils = modules.documentUtils;
        instrumentor = modules.instrumentor;
        spyOn(documentUtils, 'rewriteDocument');
        spyOn(documentUtils, 'loadAndEvalScriptSync');
    });

    describe('init and instrument', function() {
        var win = {
            a: 1
        },
            config = {
                b: 2
            };
        beforeEach(function() {
            spyOn(instrumentor, 'deactivateAndCaptureHtml');
            spyOn(instrumentor, 'modifyHtmlWithConfig');
        });
        it('should deactivateAndCaptureHtml then modifyHtmlWithConfig, then rewriteHtml', function() {
            var someHtml = 'someHtml';
            var someModifiedHtml = 'someModifiedHtml';
            instrumentor.deactivateAndCaptureHtml.andCallFake(function(win, callback) {
                callback(someHtml);
            });
            instrumentor.modifyHtmlWithConfig.andReturn(someModifiedHtml);

            instrumentor.init(config);
            instrumentor.instrument(win);

            expect(instrumentor.deactivateAndCaptureHtml).toHaveBeenCalled();
            expect(instrumentor.deactivateAndCaptureHtml.mostRecentCall.args[0]).toBe(win);
            expect(instrumentor.modifyHtmlWithConfig).toHaveBeenCalledWith(someHtml);
            expect(documentUtils.rewriteDocument).toHaveBeenCalledWith(win, someModifiedHtml);
        });
    });

    describe('deactivateAndCaptureHtml', function() {
        var html;

        function init(prefix, suffix) {
            runs(function() {
                window.tmp = function() {
                    instrumentor.deactivateAndCaptureHtml(testutils.frame.win, function(_html) {
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
            var prefix = '<html><head>',
                suffix = '</head></html>';
            init(prefix, suffix);
            runs(function() {
                expect(html).toBe(prefix + suffix);
            });
        });

        it('should not execute scripts after it', function() {
            var prefix = '<html><head>',
                suffix = '<script>window.test=true;</script></head></html>';
            init(prefix, suffix);
            runs(function() {
                expect(html).toBe(prefix + suffix);
                expect(testutils.frame.win.test).toBeUndefined();
            });
        });
    });

    describe('modifyHtmlWithConfig', function() {
        describe('prepends', function() {
            var html;
            beforeEach(function() {
                html = '<head>something';
            });
            describe('callbacks', function() {
                it('should add a script tag after <head>', function() {
                    var callback = jasmine.createSpy('callback');
                    instrumentor.init({
                        prepends: [callback]
                    });
                    html = instrumentor.modifyHtmlWithConfig(html);
                    expect(html).toBe('<head>' + '<script type="text/javascript">(opener||parent).uitest.instrument.callbacks[0](window);</script>something');
                });
                it('should call the callback with dependency injection', function() {
                    var receivedArgs;
                    var callback = function(a) {
                            receivedArgs = arguments;
                        };
                    instrumentor.init({
                        prepends: [callback]
                    });
                    instrumentor.modifyHtmlWithConfig(html);
                    instrumentor.instrument.callbacks[0]({
                        a: 1
                    });
                    expect(receivedArgs).toEqual([1]);
                });
            });
            it('should add a script tag for every config.prepend script-url after <head>', function() {
                instrumentor.init({
                    prepends: ['someUrlScript']
                });
                html = instrumentor.modifyHtmlWithConfig(html);
                expect(html).toBe('<head>' + '<script type="text/javascript" src="someUrlScript"></script>something');
            });
        });
        describe('appends', function() {
            describe('without requirejs', function() {
                describe('callbacks', function() {
                    it('should add a script tag before </body>', function() {
                        var html = 'something</body>';
                        instrumentor.init({
                            appends: [jasmine.createSpy('callback')]
                        });
                        html = instrumentor.modifyHtmlWithConfig(html);
                        expect(html).toBe('something' + '<script type="text/javascript">(opener||parent).uitest.instrument.callbacks[0](window);</script></body>');
                    });
                    it('should call callbacks with dependency injection', function() {
                        var html = 'something</body>';
                        var receivedArgs;
                        var callback = function(a) {
                                receivedArgs = arguments;
                            };
                        instrumentor.init({
                            appends: [callback]
                        });
                        instrumentor.modifyHtmlWithConfig(html);
                        instrumentor.instrument.callbacks[0]({
                            a: 1
                        });
                        expect(receivedArgs).toEqual([1]);
                    });
                });
                it('should add a script tag for every config.append script-url', function() {
                    var html = 'something</body>';
                    instrumentor.init({
                        appends: ['someUrlScript']
                    });
                    html = instrumentor.modifyHtmlWithConfig(html);
                    expect(html).toBe('something' + '<script type="text/javascript" src="someUrlScript"></script></body>');
                });
            });
            xdescribe('with requirejs', function() {
                it('should replace the requirejs script with an inline script', function() {
                    instrumentor.init({});
                    var html = 'before<script src="require.js"></script>after';
                    html = instrumentor.modifyHtmlWithConfig(html);
                    expect(html).toBe('before<script type="text/javascript">(opener||parent).uitest.instrument.callbacks[0](window);</script>after');
                });
                // TODO further tests...
            });
        });

        describe('intercepts', function() {
            describe('without requirejs', function() {
                var xhr, win, originalFn, originalThis, originalArguments, evaledScript;
                beforeEach(function() {
                    xhr = {
                        open: jasmine.createSpy('open'),
                        send: jasmine.createSpy('send')
                    };
                    win = {
                        someGlobal: 'glob'
                    };
                    originalFn = jasmine.createSpy('original');
                    originalThis = {
                        a: 1
                    };
                    originalArguments = ['loc'];
                });

                function simulateLoad(instrumentCb) {
                    instrumentor.init({
                        intercepts: [{
                            scriptUrl: 'interceptUrl',
                            fnName: 'someName',
                            callback: instrumentCb
                        }]
                    });
                    instrumentor.modifyHtmlWithConfig('<script src="interceptUrl"></script>');
                    instrumentor.instrument.callbacks[0](win);
                    evaledScript = documentUtils.loadAndEvalScriptSync.mostRecentCall.args[2]('function someName(){');
                    instrumentor.instrument.callbacks[1](win, originalFn, originalThis, originalArguments);
                }

                it('should replace intercepted scripts with an inline script', function() {
                    instrumentor.init({
                        intercepts: [{
                            scriptUrl: 'interceptUrl'
                        }]
                    });
                    var html = '<script src="interceptUrl"></script><script src="nonInterceptUrl"></script>';
                    html = instrumentor.modifyHtmlWithConfig(html);
                    expect(html).toBe('<script type="text/javascript">(opener||parent).uitest.instrument.callbacks[0](window);</script><script src="nonInterceptUrl"></script>');
                });
                it('should load the original script using docUtils.loadAndEvalScriptSync', function() {
                    instrumentor.init({
                        intercepts: [{
                            scriptUrl: 'interceptUrl'
                        }]
                    });
                    instrumentor.modifyHtmlWithConfig('<script src="interceptUrl"></script>');
                    instrumentor.instrument.callbacks[0](win);
                    var args = documentUtils.loadAndEvalScriptSync.mostRecentCall.args;
                    expect(args[0]).toBe(win);
                    expect(args[1]).toBe('interceptUrl');
                });
                it('should instrument named functions in the original script', function() {
                    var instrumentCallback = jasmine.createSpy('callback');
                    simulateLoad(instrumentCallback);
                    expect(evaledScript).toEqual('function someName(){if (!someName.delegate)return (opener||parent).uitest.instrument.callbacks[1](window,someName,this,arguments);');
                });
                it('should call the intercept callback using dependency injection', function() {
                    var instrumentCbArgs, instrumentCbSelf;
                    originalFn = function(someLocal) {

                    };
                    var instrumentCb = function(someGlobal, someLocal, $delegate) {
                            instrumentCbArgs = arguments;
                            instrumentCbSelf = this;
                        };
                    simulateLoad(instrumentCb);
                    expect(instrumentCbArgs).toEqual(['glob','loc',
                    {
                        name: 'someName',
                        fn: originalFn,
                        self: originalThis,
                        args: originalArguments
                    }]);
                    expect(instrumentCbSelf).toBe(originalThis);
                });
                it('should allow the instrumentCb to call the original function', function() {
                    var instrumentCb = function($delegate) {
                            $delegate.fn.apply($delegate.self, $delegate.args);
                        };
                    simulateLoad(instrumentCb);
                    expect(originalFn.mostRecentCall.args).toEqual(originalArguments);
                });

            });
            describe('with requirejs', function() {
                // TODO
            });
        });
    });
});
