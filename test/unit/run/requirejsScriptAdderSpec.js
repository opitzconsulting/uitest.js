describe('run/requirejsScriptAdder', function() {
    var preprocessor, instrumentor, testframe, testframeWin, documentUtils, config, global, utils,
        REQUIREJS_SCRIPT = '<script src="require.js"></script>',
        HTML = 'before' + REQUIREJS_SCRIPT + 'after</body>',
        require, win, requireCallback, someDepNames, someDepValues, requireLoad, loadContext;
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
                return "##rc(" + args.join(",") + ");";
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
        }, ["run/requirejsScriptAdder", "documentUtils", "utils"]);
        documentUtils = modules.documentUtils;
        utils = modules.utils;
        preprocessor = modules["run/requirejsScriptAdder"];

        spyOn(documentUtils, 'loadAndEvalScriptSync');
        spyOn(documentUtils, 'loadFile');

        require = jasmine.createSpy('require');
        requireLoad = jasmine.createSpy('requireLoad');
        require.load = requireLoad;
        requireCallback = jasmine.createSpy('requireCallback');
        someDepNames = ['someDepName'];
        someDepValues = ['someDepValue'];
        win = {
            require: require,
            a: 1
        };
        loadContext = {
            registry: {},
            completeLoad: jasmine.createSpy('completeLoad')
        };
    });
    it('should append an inline script after requirejs', function() {
        var html = preprocessor.preprocess(HTML);
        expect(html).toBe('before' + REQUIREJS_SCRIPT + '<script type="text/javascript">##rc(window);</script>after</body>');
    });
    it('should call the original require-callback with the original args', function() {
        var reqConfig = {};

        require.config = reqConfig;
        preprocessor.preprocess(HTML);
        instrumentor.createRemoteCallExpression.argsForCall[0][0](win);

        expect(win.require).not.toBe(require);
        expect(win.require.config).toBe(reqConfig);

        win.require(someDepNames, requireCallback);
        expect(require.mostRecentCall.args[0]).toBe(someDepNames);
        require.mostRecentCall.args[1](someDepValues);
        expect(requireCallback).toHaveBeenCalledWith(someDepValues);
    });
    describe('load interceptor', function() {
        var someModuleName = 'someModule';
        function exec(url) {
            loadContext.registry.someModule = {};
            preprocessor.preprocess(HTML);
            expect(require.load).not.toHaveBeenCalled();
            instrumentor.createRemoteCallExpression.argsForCall[0][0](win);
            require.load(loadContext, someModuleName, url);
        }
        it('should call the original require.load url', function() {
            exec("someUrl");
            expect(requireLoad).toHaveBeenCalledWith(loadContext, someModuleName, "someUrl");
        });
        it('should allow a loadInterceptor to change the url', function() {
            preprocessor.addLoadInterceptor(10, function(url, callback) {
                return url+'?1';
            });
            exec("someUrl");
            expect(requireLoad).toHaveBeenCalledWith(loadContext, someModuleName, "someUrl?1");
        });
        it('should execute the loadInterceptors ordered by their priority', function() {
            preprocessor.addLoadInterceptor(10, function(url, callback) {
                return url+'?10';
            });
            preprocessor.addLoadInterceptor(20, function(url, callback) {
                return url+'?20';
            });
            exec("someUrl");
            expect(requireLoad).toHaveBeenCalledWith(loadContext, someModuleName, "someUrl?20?10");
        });
        it('should allow a loadInterceptor to replace the default load in success case', function() {
            preprocessor.addLoadInterceptor(10, function(url, callback) {
                callback();
            });
            exec("someUrl");
            expect(requireLoad).not.toHaveBeenCalled();
            expect(loadContext.completeLoad).toHaveBeenCalledWith('someModule');
        });
        it('should allow a loadInterceptor to replace the default load in error case', function() {
            var someError = new Error("someError");
            preprocessor.addLoadInterceptor(10, function(url, callback) {
                callback(someError);
            });
            expect(function() {
                exec("someUrl");
            }).toThrow(new Error("someError"));
            expect(loadContext.completeLoad).not.toHaveBeenCalled();
            expect(requireLoad).not.toHaveBeenCalled();
            expect(loadContext.registry.someModule).toEqual({
                error: true
            });
        });
    });

    describe('append', function() {
        it('should clear the runConfig.appends, so the defaultScriptAdder will no more append the scripts', function() {
            config.appends = [jasmine.createSpy('callback')];
            var html = preprocessor.preprocess(HTML);
            expect(config.appends.length).toBe(0);
        });
        it('should work for reloads, i.e. when the preprocessor is called multiple times', function() {
            config.appends = [jasmine.createSpy('callback')];
            preprocessor.preprocess(HTML);
            expect(instrumentor.createRemoteCallExpression.callCount).toBe(1);
            preprocessor.preprocess(HTML);
            expect(instrumentor.createRemoteCallExpression.callCount).toBe(2);
        });
        it('should not add a script tag before </body>', function() {
            config.appends = [jasmine.createSpy('callback')];
            var html = preprocessor.preprocess(HTML);
            expect(html).toBe('before' + REQUIREJS_SCRIPT + '<script type="text/javascript">##rc(window);</script>after</body>');
        });
        it('should call callbacks with dep.inj. before calling the original callback', function() {
            var receivedArgs;
            var callback = function(a) {
                    receivedArgs = arguments;
                };
            config.appends = [callback];
            preprocessor.preprocess(HTML);
            instrumentor.createRemoteCallExpression.argsForCall[0][0](win);

            expect(receivedArgs).toBeUndefined();
            win.require(someDepNames, requireCallback);
            require.mostRecentCall.args[1](someDepValues);
            expect(receivedArgs).toEqual([1]);
            expect(requireCallback.mostRecentCall.args[0]).toEqual(someDepValues);
        });
        it('should add scripts using nested require calls and then call the original require callback', function() {
            config.appends = ['someScript'];
            preprocessor.preprocess(HTML);
            instrumentor.createRemoteCallExpression.argsForCall[0][0](win);

            win.require(someDepNames, requireCallback);
            expect(require.mostRecentCall.args[0]).toBe(someDepNames);
            require.mostRecentCall.args[1](someDepValues);
            expect(requireCallback).not.toHaveBeenCalled();
            expect(require.mostRecentCall.args[0]).toEqual(['someScript']);
            require.mostRecentCall.args[1]();
            expect(requireCallback).toHaveBeenCalledWith(someDepValues);
        });
    });
    describe('intercept', function() {
        function simulateLoad(intercept, scriptUrl) {
            scriptUrl = scriptUrl || 'interceptUrl';
            config.intercepts = [intercept];
            preprocessor.preprocess(HTML);
            instrumentor.createRemoteCallExpression.argsForCall[0][0](win);
            require.load(loadContext, 'someModule', scriptUrl);
        }

        it('should load the original script using docUtils.loadAndEvalScriptSync and a cache busting url', function() {
            simulateLoad({
                script: 'interceptUrl'
            });

            var args = documentUtils.loadAndEvalScriptSync.mostRecentCall.args;
            expect(args[0]).toBe(testframeWin);
            expect(args[1]).toBe('interceptUrl');

            expect(loadContext.completeLoad).toHaveBeenCalledWith('someModule');
        });
        it('should do nothing if the filename does not match', function() {
            simulateLoad({
                script: 'interceptUrl2'
            });

            expect(documentUtils.loadAndEvalScriptSync).not.toHaveBeenCalled();
        });
        it('should match ignoring the folder', function() {
            simulateLoad({
                script: 'interceptUrl'
            }, 'someFolder/interceptUrl');

            expect(documentUtils.loadAndEvalScriptSync).toHaveBeenCalled();
        });
        it('should mark the module as erroneous if docUtils.loadAndEvalScriptSync threw an error', function() {
            loadContext.registry.someModule = {};
            documentUtils.loadAndEvalScriptSync.andThrow(new Error("someError"));

            expect(function() {
                simulateLoad({
                    script: 'interceptUrl'
                });
            }).toThrow(new Error("someError"));
            expect(loadContext.registry.someModule).toEqual({
                error: true
            });
            expect(loadContext.completeLoad).not.toHaveBeenCalled();
        });

        describe('function instrumentation', function() {
            var evaledScript, originalThis, originalArguments, originalFn;
            beforeEach(function() {
                win.someGlobal = 'glob';
                originalFn = jasmine.createSpy('originalFn');
                originalThis = {
                    a: 1
                };
                originalArguments = ['loc'];
            });

            function simulateLoadAndFnCall(instrumentCb) {
                simulateLoad({
                    script: 'interceptUrl',
                    fn: 'someName',
                    callback: instrumentCb
                });

                evaledScript = documentUtils.loadAndEvalScriptSync.mostRecentCall.args[2]('function someName(){');
                instrumentor.createRemoteCallExpression.argsForCall[1][0](win, originalFn, originalThis, originalArguments);
            }

            it('should instrument named functions in the original script', function() {
                config.intercepts = [{
                    script: 'interceptUrl'
                }];
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

});