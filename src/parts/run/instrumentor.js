uitest.define('run/instrumentor', ['run/injector', 'documentUtils', 'run/config', 'annotate', 'run/logger'], function(injector, docUtils, runConfig, annotate, logger) {

    var exports,
        NO_SCRIPT_TAG = "noscript",
        REQUIRE_JS_RE = /require[^a-z]/,
        // group 1: name of function
        NAMED_FUNCTION_RE = /function\s*(\w+)[^\{]*\{/g;

    instrument.callbacks = [];

    function instrument(win) {
        logger.log("starting instrumentation");
        exports.internal.deactivateAndCaptureHtml(win, function(html) {
            html = exports.internal.modifyHtmlWithConfig(html);
            docUtils.rewriteDocument(win, html);
        });
    }

    function deactivateAndCaptureHtml(win, callback) {
        // This will wrap the rest of the document into a noscript tag.
        // By this, that content will not be executed!
        var htmlPrefix = docUtils.serializeHtmlBeforeLastScript(win.document);
        win.document.write('</head><body><' + NO_SCRIPT_TAG + '>');
        win.addEventListener('load', function() {
            var noscriptEl = win.document.getElementsByTagName(NO_SCRIPT_TAG)[0];
            callback(htmlPrefix + noscriptEl.textContent);
        }, false);
    }

    function createRemoteCallExpression(callback) {
        var argExpressions = Array.prototype.slice.call(arguments, 1) || [],
            callbackId = instrument.callbacks.length;
        instrument.callbacks.push(callback);
        return "parent.uitest.instrument.callbacks["+callbackId+"]("+argExpressions.join(",")+");";
    }

    function modifyHtmlWithConfig(html) {
        if (runConfig.prepends) {
            html = handlePrepends(html, runConfig.prepends);
        }
        var scripts = handleScripts(html, runConfig);
        html = scripts.html;
        if (!scripts.requirejs) {
            if (runConfig.appends) {
                html = handleAppends(html, runConfig.appends);
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
                if (!scriptUrl) {
                    return;
                }
                
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

            if (!win.require) {
                throw new Error("requirejs script was detected by url matching, but no global require function found!");
            }

            patchRequire();
            patchLoad();
            
            function patchRequire() {
                _require = win.require;
                win.require = function(deps, originalCallback) {
                    _require(deps, function () {
                        var args = arguments,
                            self = this;
                        execAppends(function() {
                            originalCallback.apply(self, args);
                        });
                    });
                };
                win.require.config = _require.config;
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
            var i, matchingIntercepts = { empty: true },
                urlFilename = filenameFor(url);
            if (intercepts) {
                for (i=0; i<intercepts.length; i++) {
                    if (intercepts[i].script===urlFilename) {
                        matchingIntercepts[intercepts[i].fn] = intercepts[i];
                        matchingIntercepts.empty = false;
                    }
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
                        var originalArgNames = annotate(fn),
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

    function filenameFor(url) {
        var lastSlash = url.lastIndexOf('/');
        if (lastSlash!==-1) {
            return url.substring(lastSlash+1);
        }
        return url;
    }

    function isString(obj) {
        return obj && obj.slice;
    }

    exports = {
        internal: {
            instrument: instrument,
            deactivateAndCaptureHtml: deactivateAndCaptureHtml,
            modifyHtmlWithConfig: modifyHtmlWithConfig
        },
        global: {
            uitest: {
                instrument: instrument
            }
        }
    };
    return exports;
});