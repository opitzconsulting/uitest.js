uitest.define('instrumentor', ['injector', 'documentUtils'], function(injector, docUtils) {

    var exports,
        NO_SCRIPT_TAG = "noscript",
        currentConfig,
        REQUIRE_JS_RE = /require[^a-z]/,
        // group 1: name of function
        NAMED_FUNCTION_RE = /function\s*(\w+)[^{]*{/g;

    function init(config) {
        currentConfig = config;
        instrument.callbacks = [];
    }

    function instrument(win) {
        exports.deactivateAndCaptureHtml(win, function(html) {
            html = exports.modifyHtmlWithConfig(html);
            docUtils.rewriteDocument(win, html);
        });
    }

    function deactivateAndCaptureHtml(win, callback) {
        // This will wrap the rest of the document into a noscript tag.
        // By this, that content will not be executed!
        var htmlPrefix = docUtils.serializeHtmlBeforeLastScript(win.document);
        win.document.write('</head><body><' + NO_SCRIPT_TAG + '>');
        win.document.addEventListener('DOMContentLoaded', function() {
            var noscriptEl = win.document.getElementsByTagName(NO_SCRIPT_TAG)[0];
            callback(htmlPrefix + noscriptEl.textContent);
        }, false);
    }

    function createRemoteCallExpression(callback) {
        var argExpressions = Array.prototype.slice.call(arguments, 1) || [],
            callbackId = instrument.callbacks.length;
        instrument.callbacks.push(callback);
        return "(opener||parent).uitest.instrument.callbacks["+callbackId+"]("+argExpressions.join(",")+");";
    }

    function modifyHtmlWithConfig(html) {
        if (currentConfig.prepends) {
            html = handlePrepends(html, currentConfig.prepends);
        }
        var scripts = handleScripts(html, currentConfig);
        html = scripts.html;
        if (!scripts.requirejs) {
            if (currentConfig.appends) {
                html = handleAppends(html, currentConfig.appends);
            }
        }

        return html;

        function handlePrepends(html, prepends) {
            var htmlArr = ['<head>'], i;
            for (i=0; i<prepends.length; i++) {
                createScriptTagForPrependOrAppend(htmlArr, prepends[i]);
            }
            return html.replace(/<head>/, htmlArr.join(''));
        }

        function handleAppends(html, appends) {
            var htmlArr = [], i;
            for (i=0; i<appends.length; i++) {
                createScriptTagForPrependOrAppend(htmlArr, appends[i]);
            }
            htmlArr.push('</body>');
            return html.replace(/<\/body>/, htmlArr.join(''));
        }

        function createScriptTagForPrependOrAppend(html, prependOrAppend) {
            if (isString(prependOrAppend)) {
                html.push(docUtils.urlScriptHtml(prependOrAppend));
            } else {
                html.push(docUtils.contentScriptHtml(createRemoteCallExpression(injectedCallback(prependOrAppend), 'window')));
            }
        }

        function injectedCallback(prepend) {
            return function(win) {
                return injector.inject(prepend, win, [win]);
            };
        }

        function handleScripts(html, config) {
            var requirejs = false;
            html = docUtils.replaceScripts(html, function(scriptTag, scriptUrl, textContent) {
                if (!scriptUrl) return;
                
                if (scriptUrl.match(REQUIRE_JS_RE)) {
                    requirejs = true;
                    return scriptTag+"</script>"+
                        docUtils.contentScriptHtml(createRemoteCallExpression(function(win) {
                        handleRequireJsScript(win, config);
                    }, "window"));
                }

                var matchingIntercepts = findMatchingIntercepts(scriptUrl, config.intercepts);
                if (!matchingIntercepts.empty) {
                    return docUtils.contentScriptHtml(createRemoteCallExpression(function(win) {
                        handleInterceptScript(win, matchingIntercepts, scriptUrl);
                    }, "window"));
                }
            });

            return {
                requirejs: requirejs,
                html: html
            };
        }

        function handleRequireJsScript(win, config) {
            var _require, _load;

            patchRequire();
            patchLoad();
            
            function patchRequire() {
                _require = win.require;
                _require.config = _require.config;
                win.require = function(deps, originalCallback) {
                    _require(deps, function () {
                        var args = arguments,
                            self = this;
                        execAppends(function() {
                            originalCallback.apply(self, args);
                        });
                    });
                };
            }

            function execAppends(finishedCallback) {
                var appends = config.appends,
                    i = 0;
                execNext();
                
                function execNext() {
                    var append;
                    if (i>=config.appends.length) {
                        finishedCallback();
                    } else {
                        append = config.appends[i++];
                        if (isString(append)) {
                            _require([append], execNext);
                        } else {
                            // TODO error handling!
                            injector.inject(append, win, [win]);
                            execNext();
                        }
                    }
                }

            }

            function patchLoad() {
                _load = _require.load;
                _require.load = function (context, moduleName, url) {
                    var matchingIntercepts = findMatchingIntercepts(url, config.intercepts);
                    if (matchingIntercepts.empty) {
                        return _load.apply(this, arguments);
                    }
                    try {
                        handleInterceptScript(win, matchingIntercepts, url);
                        context.completeLoad(moduleName);
                    } catch (error) {
                        //Set error on module, so it skips timeout checks.
                        context.registry[moduleName].error = true;
                        throw error;
                    }
                };
            }
        }

        function findMatchingIntercepts(url, intercepts) {
            var i, matchingIntercepts = { empty: true };
            if (!intercepts) return matchingIntercepts;
            for (i=0; i<intercepts.length; i++) {
                if (intercepts[i].scriptUrl===url) {
                    matchingIntercepts[intercepts[i].fnName] = intercepts[i];
                    matchingIntercepts.empty = false;
                }
            }
            return matchingIntercepts;
        }

        function handleInterceptScript(win, matchingInterceptsByName, scriptUrl) {
            // Need to do the xhr in sync here so the script execution order in the document
            // stays the same!
            docUtils.loadAndEvalScriptSync(win, scriptUrl, preProcessCallback);

            function preProcessCallback(data) {
                return data.replace(NAMED_FUNCTION_RE, function(all, fnName) {
                    if (matchingInterceptsByName[fnName]) {
                        return all+'if (!'+fnName+'.delegate)return '+
                            createRemoteCallExpression(fnCallback, "window", fnName, "this", "arguments");
                    }
                    return all;

                    function fnCallback(win, fn, self, args) {
                        var originalArgNames = injector.annotate(fn),
                            originalArgsByName = {},
                            $delegate = {fn:fn, name: fnName, self: self, args: args},
                            i;
                        for (i=0; i<args.length; i++) {
                            originalArgsByName[originalArgNames[i]] = args[i];
                        }
                        fn.delegate = true;
                        try {
                            return injector.inject(matchingInterceptsByName[fnName].callback,
                                self, [originalArgsByName, {$delegate: $delegate}, win]);
                        } finally {
                            fn.delegate = false;
                        }
                    }
                });
            }
        }

    }

    function isString(obj) {
        return obj && obj.slice;
    }

    exports = {
        init: init,
        instrument: instrument,
        deactivateAndCaptureHtml: deactivateAndCaptureHtml,
        modifyHtmlWithConfig: modifyHtmlWithConfig,
        global: {
            uitest: {
                instrument: instrument
            }
        }
    };
    return exports;
});