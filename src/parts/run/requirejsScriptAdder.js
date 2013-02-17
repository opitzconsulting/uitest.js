uitest.define('run/requirejsScriptAdder', ['run/config', 'run/instrumentor', 'run/defaultScriptAdder', 'documentUtils', 'run/injector', 'run/logger', 'utils'], function(runConfig, instrumentor, defaultScriptAdder, docUtils, injector, logger, utils) {
    var REQUIRE_JS_RE = /require[\W]/;

    instrumentor.addPreprocessor(11, preprocess);

    function preprocess(html) {
        return docUtils.replaceScripts(html, function(parsedScript) {
            var appends = runConfig.appends,
                intercepts = runConfig.intercepts;

            if(!parsedScript.scriptUrl) {
                return undefined;
            }
            if(parsedScript.scriptUrl.match(REQUIRE_JS_RE)) {
                // Empty the appends array in the config,
                // so the defaultScriptAdder does nothing for them.
                logger.log("detected requirejs with script url "+parsedScript.scriptUrl);
                runConfig.appends = [];
                return parsedScript.match + docUtils.contentScriptHtml(instrumentor.createRemoteCallExpression(function(win) {
                    afterRequireJsScript(win, appends, intercepts);
                }, "window"));
            }

            return undefined;
        });
    }

    function afterRequireJsScript(win, appends, intercepts) {
        if(!win.require) {
            throw new Error("requirejs script was detected by url matching, but no global require function found!");
        }

        var _require = patchRequire(win, appends);
        patchLoad(_require, intercepts);
    }

    function patchRequire(win, appends) {
        var _require = win.require;
        win.require = function(deps, originalCallback) {
            _require(deps, function() {
                var args = arguments,
                    self = this;
                execAppends(win, _require, appends, function() {
                    originalCallback.apply(self, args);
                });
            });
        };
        win.require.config = _require.config;
        return _require;
    }

    function execAppends(win, _require, appends, finishedCallback) {
        var i = 0;
        logger.log("adding appends using requirejs");
        execNext();

        function execNext() {
            var append;
            if(i >= appends.length) {
                finishedCallback();
            } else {
                append = appends[i++];
                if(utils.isString(append)) {
                    _require([append], execNext);
                } else {
                    injector.inject(append, win, [win]);
                    execNext();
                }
            }
        }
    }

    function patchLoad(_require, intercepts) {
        var _load = _require.load;
        _require.load = function(context, moduleName, url) {
            
            var scriptExecutor = defaultScriptAdder.createInterceptingScriptExecutor(url, intercepts);
            if(!scriptExecutor) {
                return _load.apply(this, arguments);
            }
            try {
                scriptExecutor();
                context.completeLoad(moduleName);
            } catch(error) {
                //Set error on module, so it skips timeout checks.
                context.registry[moduleName].error = true;
                throw error;
            }
        };
    }

    return {
        preprocess: preprocess
    };

});