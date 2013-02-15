uitest.define('run/instrumentor', ['run/injector', 'documentUtils', 'run/config', 'annotate', 'run/logger'], function(injector, docUtils, runConfig, annotate, logger) {

    var exports, NO_SCRIPT_TAG = "noscript",
        REQUIRE_JS_RE = /require[\W]/,
        // group 1: name of function
        NAMED_FUNCTION_RE = /function\s*(\w+)[^\{]*\{/g;

    instrument.callbacks = [];

    function instrument(win) {
        logger.log("starting instrumentation");
        exports.internal.deactivateAndCaptureHtml(win, function(html, browserFlags) {
            logger.log("captured html");
            html = exports.internal.modifyHtmlWithConfig(html);
            if(browserFlags.ieLt10) {
                logger.log("applying ie<10 bugfix");
                html = exports.internal.fixIeLesserThan10ScriptExecutionOrderWithDocumentWrite(html);
            }
            html = exports.internal.forceScriptRefresh(win, html);
            docUtils.rewriteDocument(win, html);
        });
    }

    function deactivateAndCaptureHtml(win, callback) {
        // This will wrap the rest of the document into a noscript tag.
        // By this, that content will not be executed!
        var htmlPrefix = docUtils.serializeHtmlBeforeLastScript(win.document);
        win.document.write('<!--[if lt IE 10]>' + docUtils.contentScriptHtml('window.ieLt10=true;') + '<![endif]-->');
        win.document.write('</head><body><' + NO_SCRIPT_TAG + '>');
        win.addEventListener('load', function() {
            var noscriptEl = win.document.getElementsByTagName(NO_SCRIPT_TAG)[0];
            var noscriptElContent = noscriptEl.textContent;
            var browserFlags = {
                ieLt10: !! win.ieLt10
            };
            if(noscriptElContent) {
                callback(htmlPrefix + noscriptElContent, browserFlags);
            } else {
                logger.log("couldn't retrive the document html using the noscript hack, doing another xhr request...");
                // Android 2.3 browsers don't wrap the rest of the document
                // into the noscript tag, but leave it empty :-(
                // At least it stops the document from loading...
                docUtils.loadFile(win, win.document.location.href, true, function(error, data) {
                    if(error) {
                        throw error;
                    }
                    data = data.replace("parent.uitest.instrument(window)", "");
                    callback(data, browserFlags);
                });
            }
        }, false);
    }

    function createRemoteCallExpression(callback) {
        var argExpressions = Array.prototype.slice.call(arguments, 1) || [],
            callbackId = instrument.callbacks.length;
        instrument.callbacks.push(callback);
        return "parent.uitest.instrument.callbacks[" + callbackId + "](" + argExpressions.join(",") + ");";
    }

    function modifyHtmlWithConfig(html) {
        if(runConfig.prepends) {
            html = handlePrepends(html, runConfig.prepends);
        }
        var scripts = handleScripts(html, runConfig);
        html = scripts.html;
        if(!scripts.requirejs) {
            if(runConfig.appends) {
                html = handleAppends(html, runConfig.appends);
            }
        }
        return html;

        function handlePrepends(html, prepends) {
            var htmlArr = ['<head>'],
                i;
            createScriptTagForPrependsOrAppends(htmlArr, prepends);
            return html.replace(/<head>/, htmlArr.join(''));
        }

        function handleAppends(html, appends) {
            var htmlArr = [],
                i;
            createScriptTagForPrependsOrAppends(htmlArr, appends);
            htmlArr.push('</body>');
            return html.replace(/<\/body>/, htmlArr.join(''));
        }

        function createScriptTagForPrependsOrAppends(html, prependsOrAppends) {
            var i, prependOrAppend, lastCallbackArr;
            for(i = 0; i < prependsOrAppends.length; i++) {
                prependOrAppend = prependsOrAppends[i];
                if(isString(prependOrAppend)) {
                    html.push(docUtils.urlScriptHtml(prependOrAppend));
                    lastCallbackArr = null;
                } else {
                    if(!lastCallbackArr) {
                        lastCallbackArr = [];
                        html.push(docUtils.contentScriptHtml(createRemoteCallExpression(injectedCallbacks(lastCallbackArr), 'window')));
                    }
                    lastCallbackArr.push(prependOrAppend);
                }
            }
        }

        function injectedCallbacks(callbacks) {
            return function(win) {
                var i;
                for(i = 0; i < callbacks.length; i++) {
                    injector.inject(callbacks[i], win, [win]);
                }
            };
        }

        function handleScripts(html, config) {
            var requirejs = false;
            html = docUtils.replaceScripts(html, function(parsedScript) {
                if(!parsedScript.scriptUrl) {
                    return undefined;
                }
                if(parsedScript.scriptUrl.match(REQUIRE_JS_RE)) {
                    requirejs = true;
                    return parsedScript.match + docUtils.contentScriptHtml(createRemoteCallExpression(function(win) {
                        handleRequireJsScript(win, config);
                    }, "window"));
                }

                var matchingIntercepts = findMatchingIntercepts(parsedScript.scriptUrl, config.intercepts);
                if(!matchingIntercepts.empty) {
                    return docUtils.contentScriptHtml(createRemoteCallExpression(function(win) {
                        handleInterceptScript(win, matchingIntercepts, parsedScript.scriptUrl);
                    }, "window"));
                } else {
                    return undefined;
                }
            });

            return {
                requirejs: requirejs,
                html: html
            };
        }

        function handleRequireJsScript(win, config) {
            var _require, _load;

            if(!win.require) {
                throw new Error("requirejs script was detected by url matching, but no global require function found!");
            }

            patchRequire();
            patchLoad();

            function patchRequire() {
                _require = win.require;
                win.require = function(deps, originalCallback) {
                    _require(deps, function() {
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
                    if(i >= config.appends.length) {
                        finishedCallback();
                    } else {
                        append = config.appends[i++];
                        if(isString(append)) {
                            _require([append], execNext);
                        } else {
                            injector.inject(append, win, [win]);
                            execNext();
                        }
                    }
                }

            }

            function patchLoad() {
                _load = _require.load;
                _require.load = function(context, moduleName, url) {
                    var matchingIntercepts = findMatchingIntercepts(url, config.intercepts);
                    if(matchingIntercepts.empty) {
                        return _load.apply(this, arguments);
                    }
                    try {
                        handleInterceptScript(win, matchingIntercepts, url);
                        context.completeLoad(moduleName);
                    } catch(error) {
                        //Set error on module, so it skips timeout checks.
                        context.registry[moduleName].error = true;
                        throw error;
                    }
                };
            }
        }

        function handleInterceptScript(win, matchingInterceptsByName, scriptUrl) {
            // Need to do the xhr in sync here so the script execution order in the document
            // stays the same!
            docUtils.loadAndEvalScriptSync(win, scriptUrl, preProcessCallback);

            function preProcessCallback(data) {
                return data.replace(NAMED_FUNCTION_RE, function(all, fnName) {
                    if(matchingInterceptsByName[fnName]) {
                        return all + 'if (!' + fnName + '.delegate)return ' + createRemoteCallExpression(fnCallback, "window", fnName, "this", "arguments");
                    }
                    return all;

                    function fnCallback(win, fn, self, args) {
                        var originalArgNames = annotate(fn),
                            originalArgsByName = {},
                            $delegate = {
                                fn: fn,
                                name: fnName,
                                self: self,
                                args: args
                            },
                            i;
                        for(i = 0; i < args.length; i++) {
                            originalArgsByName[originalArgNames[i]] = args[i];
                        }
                        fn.delegate = true;
                        try {
                            return injector.inject(matchingInterceptsByName[fnName].callback, self, [originalArgsByName,
                            {
                                $delegate: $delegate
                            },
                            win]);
                        } finally {
                            fn.delegate = false;
                        }
                    }
                });
            }
        }

    }

    function findMatchingIntercepts(url, intercepts) {
        var i, matchingIntercepts = {
            empty: true
        },
            urlFilename = filenameFor(url);
        if(intercepts) {
            for(i = 0; i < intercepts.length; i++) {
                if(intercepts[i].script === urlFilename) {
                    matchingIntercepts[intercepts[i].fn] = intercepts[i];
                    matchingIntercepts.empty = false;
                }
            }
        }
        return matchingIntercepts;
    }

    function fixIeLesserThan10ScriptExecutionOrderWithDocumentWrite(html) {
        return docUtils.replaceScripts(html, function(parsedTag) {
            if(!parsedTag.scriptUrl) {
                return undefined;
            }
            // IE<=9 executes scripts with src urls when doing a document.write
            // out of the normal order. Because of this, we are
            // replacing them by an inline script that executes those
            // scripts using eval at the right place.
            var scriptOpenTag = parsedTag.scriptOpenTag.replace(parsedTag.srcAttribute, '');
            return scriptOpenTag + createRemoteCallExpression(function(win) {
                docUtils.loadAndEvalScriptSync(win, parsedTag.scriptUrl);
            }, "window") + '</script>';
        });
    }

    function forceScriptRefresh(win, html) {
        var now = win.Date.now();
        return docUtils.replaceScripts(html, function(parsedTag) {
            if(!parsedTag.scriptUrl) {
                return undefined;
            }
            return parsedTag.scriptOpenTag.replace(parsedTag.scriptUrl, parsedTag.scriptUrl+'?'+now)+"</script>";
        });
    }

    function filenameFor(url) {
        var lastSlash = url.lastIndexOf('/');
        if(lastSlash !== -1) {
            return url.substring(lastSlash + 1);
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
            modifyHtmlWithConfig: modifyHtmlWithConfig,
            fixIeLesserThan10ScriptExecutionOrderWithDocumentWrite: fixIeLesserThan10ScriptExecutionOrderWithDocumentWrite,
            forceScriptRefresh: forceScriptRefresh
        },
        global: {
            uitest: {
                instrument: instrument
            }
        }
    };
    return exports;
});