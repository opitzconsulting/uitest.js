uitest.define('run/defaultScriptAdder', ['run/config', 'run/instrumentor', 'documentUtils', 'run/injector', 'run/testframe', 'annotate', 'run/logger', 'urlParser', 'utils'], function(runConfig, instrumentor, docUtils, injector, testframe, annotate, logger, urlParser, utils) {
    // group 1: name of function
    var NAMED_FUNCTION_RE = /function\s*(\w+)[^\{]*\{/g;

    instrumentor.addPreprocessor(10, preprocess);

    function preprocess(html) {
        if (runConfig.prepends.length) {
            html = handlePrepends(html, runConfig.prepends);
        }
        if (runConfig.intercepts.length) {
            html = handleIntercepts(html, runConfig.intercepts);
        }
        if (runConfig.appends.length) {
            html = handleAppends(html, runConfig.appends);
        }
        return html;
    }

    function handlePrepends(html, prepends) {
        var htmlArr = [],
            i;
        logger.log("adding prepends after <head>");
        createScriptTagForPrependsOrAppends(htmlArr, prepends);
        return html.replace(/<head[^>]*>/i, function(match) {
            return match + htmlArr.join('');
        });
    }

    function handleAppends(html, appends) {
        var htmlArr = [],
            i;
        logger.log("adding appends at </body>");
        createScriptTagForPrependsOrAppends(htmlArr, appends);
        var newHtml = html.replace(/<\/body>/i, function(match) {
            return htmlArr.join('') + match;
        });
        return newHtml;
    }

    function createScriptTagForPrependsOrAppends(html, prependsOrAppends) {
        var i, prependOrAppend, lastCallbackArr;
        for(i = 0; i < prependsOrAppends.length; i++) {
            prependOrAppend = prependsOrAppends[i];
            if(utils.isString(prependOrAppend)) {
                html.push(docUtils.urlScriptHtml(prependOrAppend));
                lastCallbackArr = null;
            } else {
                if(!lastCallbackArr) {
                    lastCallbackArr = [];
                    html.push(docUtils.contentScriptHtml(instrumentor.createRemoteCallExpression(injectedCallbacks(lastCallbackArr), 'window')));
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

    function handleIntercepts(html, intercepts) {
        return docUtils.replaceScripts(html, function(parsedScript) {
            if(!parsedScript.scriptUrl) {
                return undefined;
            }

            var scriptExecutor = createInterceptingScriptExecutor(parsedScript.scriptUrl, intercepts);
            if(scriptExecutor) {
                return docUtils.contentScriptHtml(instrumentor.createRemoteCallExpression(function(win) {
                    scriptExecutor();
                }, "window"));
            } else {
                return undefined;
            }
        });
    }

    function createInterceptingScriptExecutor(scriptUrl, intercepts) {
        var matchingIntercepts = findMatchingIntercepts(scriptUrl, intercepts);
        if (matchingIntercepts.empty) {
            return undefined;
        }
        logger.log("intercepting "+scriptUrl);
        return function() {
            execInterceptScript(matchingIntercepts, scriptUrl);
        };
    }

    function findMatchingIntercepts(url, intercepts) {
        var i,
            matchingIntercepts = {
                empty: true
            },
            urlFilename = urlParser.filenameFor(url);

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

    function execInterceptScript(matchingInterceptsByName, scriptUrl) {
        // Need to do the xhr in sync here so the script execution order in the document
        // stays the same!
        docUtils.loadAndEvalScriptSync(testframe.win(), scriptUrl, preProcessCallback);

        function preProcessCallback(data) {
            return data.replace(NAMED_FUNCTION_RE, function(all, fnName) {
                if(matchingInterceptsByName[fnName]) {
                    return all + 'if (!' + fnName + '.delegate)return ' + instrumentor.createRemoteCallExpression(fnCallback, "window", fnName, "this", "arguments");
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

    return {
        preprocess: preprocess,
        handlePrepends: handlePrepends,
        handleAppends: handleAppends,
        handleIntercepts: handleIntercepts,
        createInterceptingScriptExecutor: createInterceptingScriptExecutor
    };
});