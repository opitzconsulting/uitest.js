jasmineui.define('instrumentor', ['scriptAccessor', 'globals', 'htmlParserFactory'], function (scriptAccessor, globals, htmlParserFactory) {

    var jasmineUiScriptUrl = scriptAccessor.currentScriptUrl();

    function loaderScript() {
        var helper = function (window) {
            var noScriptTag = "noscript";
            // Note: this will be replaced before the eval statement!
            var htmlParserFactory = HTML_PARSER_FACTORY;
            var htmlParser = htmlParserFactory();
            var htmlPrefix = htmlParser.serializeHtmlBeforeCurrentScript(window.document);

            window.jasmineui_client = true;

            deactivateAndCaptureRestOfDocumentAsString(function(htmlSuffix) {
                htmlSuffix = modifyHtml(htmlSuffix);
                var pageHtml = htmlPrefix +
                    urlScript('JASMINEUI_SCRIPT_URL') + htmlSuffix;
                replaceDocument(pageHtml);
            });

            function deactivateAndCaptureRestOfDocumentAsString(callback) {
                // This will wrap the rest of the document into a noscript tag.
                // By this, that content will not be executed!
                window.document.write('</head><body><'+noScriptTag+'>');
                window.document.addEventListener('DOMContentLoaded', function() {
                    var noscriptEl = window.document.getElementsByTagName(noScriptTag)[0];
                    callback(noscriptEl.textContent);
                }, false);
            }

            function replaceDocument(pageHtml) {
                window.document.open();
                window.document.write(pageHtml);
                window.document.close();
            }

            function urlScript(url) {
                return '<script type="text/javascript" src="' + url + '"></script>';
            }

            function inlineScript(content) {
                return '<script type="text/javascript">' + content + '</script>';
            }

            function modifyHtml(pageHtml) {
                pageHtml = htmlParser.replaceScripts(pageHtml, function (srcAttribute, textContent) {
                    if (srcAttribute) {
                        return inlineScript('jasmineui.instrumentor.onUrlScript("' + srcAttribute + '")');
                    } else {
                        textContent = htmlParser.convertScriptContentToEvalString(textContent);
                        return inlineScript('jasmineui.instrumentor.onInlineScript(' + textContent + ')');
                    }
                });
                pageHtml = pageHtml.replace("</body>", inlineScript('jasmineui.instrumentor.onEndScripts()') +
                    inlineScript('jasmineui.instrumentor.onEndCalls()')+ '</body>');
                return pageHtml;
            }
        };
        var script = "(" + helper + ")(window) //@ instrumentor.js";
        script = script.replace('JASMINEUI_SCRIPT_URL', jasmineUiScriptUrl).replace('HTML_PARSER_FACTORY', ""+htmlParserFactory);
        return script;
    }

    var endScripts = [];
    var endCalls = [];

    function beginScript(url) {
        writeUrlScript(url);
    }

    function endScript(url) {
        endScripts.push(url);
    }

    function endCall(callback) {
        endCalls.push(callback);
    }

    function onInlineScript(evalString) {
        checkForRequireJs();
        evalScriptContent(evalString);
    }

    function onUrlScript(url) {
        checkForRequireJs();
        if (isUrlInstrumented(url)) {
            loadAndEval(url, function() {
            }, function(error) {
                throw error;
            });
        } else {
            writeUrlScript(url);
        }
    }

    function onEndScripts() {
        if (checkForRequireJs()) {
            return;
        }
        var i;
        for (i = 0; i < endScripts.length; i++) {
            writeUrlScript(endScripts[i]);
        }
    }

    function onEndCalls() {
        if (checkForRequireJs()) {
            return;
        }
        var i;
        for (i = 0; i < endCalls.length; i++) {
            endCalls[i]();
        }
    }

    // ------------- helper functions ---------
    function writeUrlScript(url) {
        globals.document.write('<script type="text/javascript" src="' + url + '"></script>');
    }

    var originalRequire;

    function checkForRequireJs() {
        if (originalRequire) {
            return true;
        }
        if (!globals.require) {
            return false;
        }
        originalRequire = globals.require;
        globals.require = function (deps, originalCallback) {
            deps.push('require');
            originalRequire(deps, function () {
                var originalArgs = Array.prototype.slice.call(arguments);
                var localRequire = originalArgs[originalArgs.length - 1];
                localRequire(endScripts, function () {
                    var i;
                    for (i = 0; i < endCalls.length; i++) {
                        endCalls[i]();
                    }
                    originalCallback.apply(globals, originalArgs.slice(0, originalArgs.length - 1));
                });
            });
        };
        var _load = originalRequire.load;
        originalRequire.load = function (context, moduleName, url) {
            if (!isUrlInstrumented(url)) {
                return _load.apply(this, arguments);
            }
            loadAndEval(url, function () {
                context.completeLoad(moduleName);
            }, function (error) {
                //Set error on module, so it skips timeout checks.
                context.registry[moduleName].error = true;
                throw error;
            });
        };

        return true;
    }

    function loadAndEval(url, onload, onerror) {
        var xhr = new globals.XMLHttpRequest();
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    evalScriptContent(xhr.responseText + "//@ sourceURL=" + url);
                    onload();
                } else {
                    onerror(new Error("Error loading url " + url + ":" + xhr.statusText));
                }
            }
        };
        xhr.open("GET", url, true);
        xhr.send();
    }

    var instrumentUrlPatterns = [];
    function isUrlInstrumented(url) {
        var i, re;
        var patterns = instrumentUrlPatterns;
        for (i=0; i<patterns.length; i++) {
            re = new RegExp(patterns[i]);
            if (url.match(re)) {
                return true;
            }
        }
        return false;
    }

    function setInstrumentUrlPatterns(patterns) {
        instrumentUrlPatterns = patterns;
    }


    // group 1: name of function
    var FUNCTION_REGEX = /function\s*([^\s\(]+)[^{]*{/g;

    function evalScriptContent(scriptContent) {
        scriptContent = scriptContent.replace(FUNCTION_REGEX, function(all, fnName) {
            if (instrumentedFunctions[fnName]) {
                return all+'if (!'+fnName+'.delegate)return jasmineui.instrumentor.onFunctionCall("'+fnName+'", '+fnName+', this, arguments);';
            }
            return all;
        });
        globals.eval.call(globals, scriptContent);
    }

    function onFunctionCall(fnName, fn, self, args) {
        fn.delegate = true;
        try {
            return instrumentedFunctions[fnName].call(globals, fnName, fn, self, args);
        } finally {
            fn.delegate = false;
        }
    }

    var instrumentedFunctions = {};
    function instrumentFunction(name, callback) {
        instrumentedFunctions[name] = callback;
    }


    // public API
    return {
        globals: {
            jasmineui: {
                // private API as callback from loaderScript
                instrumentor: {
                    onEndScripts:onEndScripts,
                    onEndCalls:onEndCalls,
                    onInlineScript:onInlineScript,
                    onUrlScript:onUrlScript,
                    onFunctionCall:onFunctionCall
                },
                instrumentFunction: instrumentFunction
            }
        },
        loaderScript:loaderScript,
        beginScript:beginScript,
        endScript:endScript,
        endCall:endCall,
        setInstrumentUrlPatterns:setInstrumentUrlPatterns
    };

});