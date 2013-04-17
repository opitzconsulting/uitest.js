uitest.define('run/requirejsInstrumentor', ['run/htmlInstrumentor', 'documentUtils', 'run/injector', 'run/logger', 'utils', 'urlParser', 'run/testframe'], function(docInstrumentor, docUtils, injector, logger, utils, urlParser, testframe) {
    var REQUIRE_JS_RE = /require[\W]/,
        eventHandlers = [];

    // Needs to be executed before the scriptAdder!
    preprocessHtml.priority = 20;
    docInstrumentor.addPreProcessor(preprocessHtml);

    return {
        preprocessHtml: preprocessHtml,
        addEventListener: addEventListener
    };

    function addEventListener(handler) {
        eventHandlers.push(handler);
    }

    function preprocessHtml(event, control) {
        var token = event.token,
            state = event.state;

        if (token.type==='urlscript' && token.src.match(REQUIRE_JS_RE)) {
            handleRequireJsScriptToken();
        }
        control.next();
        return;

        function handleRequireJsScriptToken() {
            logger.log("detected requirejs with script url "+token.src);

            var content = testframe.createRemoteCallExpression(function(win) {
                afterRequireJsScript(win);
            }, "window");

            // needed by the scriptAdder to detect
            // where to append the appends!
            state.requirejs = true;
            event.pushToken({
                type: 'contentscript',
                content: content
            });
        }
    }

    function afterRequireJsScript(win) {
        if(!win.require) {
            throw new Error("requirejs script was detected by url matching, but no global require function found!");
        }

        var _require = patchRequire(win);
        patchLoad(_require);
    }

    function patchRequire(win) {
        var _require = win.require;
        win.require = function(deps, originalCallback) {
            _require.onResourceLoad = win.require.onResourceLoad;
            _require(deps, function() {
                var event = {
                    type: 'require',
                    deps: deps,
                    depsValues:arguments,
                    callback: originalCallback,
                    win:win,
                    require:_require
                };
                utils.processAsyncEvent(event, eventHandlers, defaultHandler, doneHandler);

                function defaultHandler() {
                    event.callback.apply(event.win, event.depsValues);
                }

                function doneHandler(error) {
                    if (error) {
                        throw error;
                    }
                }
            });
        };
        win.require.config = _require.config;
        return _require;
    }

    function patchLoad(_require) {
        var _load = _require.load;
        _require.load = function(context, moduleName, url) {
            var self = this;
            var event = {
                type:'load',
                url: url
            };
            utils.processAsyncEvent(event, eventHandlers, defaultHandler,doneHandler);

            function defaultHandler() {
                _load.call(self, context, moduleName, event.url);
            }

            function doneHandler(error) {
                if (error) {
                    //Set error on module, so it skips timeout checks.
                    context.registry[moduleName].error = true;
                    throw error;
                } else {
                    context.completeLoad(moduleName);
                }
            }
        };
    }

});