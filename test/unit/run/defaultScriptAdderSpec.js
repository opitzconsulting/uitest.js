describe('run/defaultScriptAdder', function() {
    var instrumentor, preprocessor, testframe, testframeWin, documentUtils, config, global;
    beforeEach(function() {
        config = {
            appends: [],
            prepends: [],
            intercepts: []
        };
        global = {
            Array: Array,
            Object: Object
        };
        instrumentor = {
            addPreprocessor: jasmine.createSpy('addPreprocessor'),
            createRemoteCallExpression: jasmine.createSpy('createRemoteCallExpression').andCallFake(function(cb) {
                var args = Array.prototype.slice.call(arguments, 1);
                return "##rc("+args.join(",")+");";
            })
        };
        testframeWin = {};
        testframe = {
            win: jasmine.createSpy().andReturn(testframeWin)
        };
        var modules = uitest.require({
            "run/config": config,
            "run/instrumentor": instrumentor,
            "run/testframe": testframe,
            global: global
        }, ["run/defaultScriptAdder"]);
        preprocessor = modules["run/defaultScriptAdder"];
        documentUtils = modules["documentUtils"];
        spyOn(documentUtils, "loadAndEvalScriptSync");
    });

    describe('prepends', function() {
        var html;
        beforeEach(function() {
            html = '<head>something';
        });
        describe('callbacks', function() {
            it('should add a script tag after <head>', function() {
                var callback = jasmine.createSpy('callback');
                config.prepends = [callback];
                html = preprocessor.preprocess(html);
                expect(html).toBe('<head>' + '<script type="text/javascript">##rc(window);</script>something');
            });
            it('should call the callback with dependency injection', function() {
                var receivedArgs;
                var callback = function(a) {
                        receivedArgs = arguments;
                    };
                config.prepends = [callback];
                preprocessor.preprocess(html);
                instrumentor.createRemoteCallExpression.mostRecentCall.args[0]({
                    a: 1
                });
                expect(receivedArgs).toEqual([1]);
            });
            it('should insert only one script tag if multiple callbacks follow each other', function() {
                var callback = jasmine.createSpy('callback');
                config.prepends = [callback, callback];
                html = preprocessor.preprocess(html);
                expect(html).toBe('<head>' + '<script type="text/javascript">##rc(window);</script>something');
                instrumentor.createRemoteCallExpression.mostRecentCall.args[0]({});
                expect(callback.callCount).toBe(2);
            });
        });
        it('should add a script tag for every config.prepend script-url after <head>', function() {
            config.prepends = ['someUrlScript'];
            html = preprocessor.preprocess(html);
            expect(html).toBe('<head>' + '<script type="text/javascript" src="someUrlScript"></script>something');
        });
        it('should work for callback, script-url, callback', function() {
            config.prepends = ['someUrlScript', jasmine.createSpy('a'), 'someScriptUrl2'];
            html = preprocessor.preprocess(html);
            expect(html).toBe('<head>' + '<script type="text/javascript" src="someUrlScript"></script><script type="text/javascript">##rc(window);</script><script type="text/javascript" src="someScriptUrl2"></script>something');
        });
    });

    describe('appends', function() {
        describe('callbacks', function() {
            it('should add a script tag before </body>', function() {
                var html = 'something</body>';
                config.appends = [jasmine.createSpy('callback')];
                html = preprocessor.preprocess(html);
                expect(html).toBe('something' + '<script type="text/javascript">##rc(window);</script></body>');
            });
            it('should call callbacks with dependency injection', function() {
                var html = 'something</body>';
                var receivedArgs;
                var callback = function(a) {
                        receivedArgs = arguments;
                    };
                config.appends = [callback];
                preprocessor.preprocess(html);
                instrumentor.createRemoteCallExpression.mostRecentCall.args[0]({
                    a: 1
                });
                expect(receivedArgs).toEqual([1]);
            });
            it('should insert only one script tag if multiple callbacks follow each other', function() {
                var html = 'something</body>',
                    callback = jasmine.createSpy('callback');
                config.appends = [callback, callback];
                html = preprocessor.preprocess(html);
                expect(html).toBe('something' + '<script type="text/javascript">##rc(window);</script></body>');
                instrumentor.createRemoteCallExpression.mostRecentCall.args[0]({});
                expect(callback.callCount).toBe(2);
            });
        });
        it('should add a script tag for every config.append script-url', function() {
            var html = 'something</body>';
            config.appends = ['someUrlScript'];
            html = preprocessor.preprocess(html);
            expect(html).toBe('something' + '<script type="text/javascript" src="someUrlScript"></script></body>');
        });
    });

    describe('intercepts', function() {
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

        function simulateLoadAndFnCall(instrumentCb) {
            config.intercepts = [{
                script: 'interceptUrl',
                fn: 'someName',
                callback: instrumentCb
            }];
            preprocessor.preprocess('<script src="interceptUrl"></script>');
            instrumentor.createRemoteCallExpression.argsForCall[0][0](win);
            evaledScript = documentUtils.loadAndEvalScriptSync.mostRecentCall.args[2]('function someName(){');
            instrumentor.createRemoteCallExpression.argsForCall[1][0](win, originalFn, originalThis, originalArguments);
        }

        it('should replace intercepted scripts with an inline script', function() {
            config.intercepts = [{
                script: 'interceptUrl'
            }];
            var html = '<script src="interceptUrl"></script><script src="nonInterceptUrl"></script>';
            html = preprocessor.preprocess(html);
            expect(html).toBe('<script type="text/javascript">##rc(window);</script><script src="nonInterceptUrl"></script>');
        });
        it('should only check the filname ignoring the folder', function() {
            config.intercepts = [{
                script: 'interceptUrl'
            }];
            var html = '<script src="someFolder/interceptUrl"></script><script src="nonInterceptUrl"></script>';
            html = preprocessor.preprocess(html);
            expect(html).toBe('<script type="text/javascript">##rc(window);</script><script src="nonInterceptUrl"></script>');
        });
        it('should load the original script using docUtils.loadAndEvalScriptSync', function() {
            config.intercepts = [{
                script: 'interceptUrl'
            }];
            preprocessor.preprocess('<script src="interceptUrl"></script>');
            instrumentor.createRemoteCallExpression.mostRecentCall.args[0]();

            var args = documentUtils.loadAndEvalScriptSync.mostRecentCall.args;
            expect(args[0]).toBe(testframeWin);
            expect(args[1]).toBe('interceptUrl');
        });
        it('should instrument named functions in the original script', function() {
            var instrumentCallback = jasmine.createSpy('callback');
            simulateLoadAndFnCall(instrumentCallback);
            expect(evaledScript).toEqual('function someName(){if (!someName.delegate)return ##rc(window,someName,this,arguments);');
        });
        it('should call the intercept callback using dependency injection', function() {
            var instrumentCbArgs, instrumentCbSelf;
            originalFn = function(someLocal) {

            };
            var instrumentCb = function(someGlobal, someLocal, $delegate) {
                    instrumentCbArgs = arguments;
                    instrumentCbSelf = this;
                };
            simulateLoadAndFnCall(instrumentCb);
            expect(instrumentCbArgs).toEqual(['glob', 'loc',
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
            simulateLoadAndFnCall(instrumentCb);
            expect(originalFn.mostRecentCall.args).toEqual(originalArguments);
        });
    });
});