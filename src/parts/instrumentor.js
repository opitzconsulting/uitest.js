uitest.define('instrumentor', ['injector'], function(injector) {

    var exports,
        NO_SCRIPT_TAG = "noscript",
        currentConfig,
        // Groups:
        // 1. text of all element attributes
        // 2. content of src attribute
        // 3. text content of script element.
        SCRIPT_RE = /<script([^>]*src=\s*"([^"]+))?[^>]*>([\s\S]*?)<\/script>/g,
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
            exports.rewriteDocument(win, html);
        });
    }

    function deactivateAndCaptureHtml(win, callback) {
        // This will wrap the rest of the document into a noscript tag.
        // By this, that content will not be executed!
        var htmlPrefix = serializeHtmlBeforeCurrentScript(win.document);
        win.document.write('</head><body><' + NO_SCRIPT_TAG + '>');
        win.document.addEventListener('DOMContentLoaded', function() {
            var noscriptEl = win.document.getElementsByTagName(NO_SCRIPT_TAG)[0];
            callback(htmlPrefix + noscriptEl.textContent);
        }, false);

    }

    function serializeDocType(doc) {
        var node = doc.doctype;
        if(!node) {
            return '';
        }
        return "<!DOCTYPE " + node.name + (node.publicId ? ' PUBLIC "' + node.publicId + '"' : '') + (!node.publicId && node.systemId ? ' SYSTEM' : '') + (node.systemId ? ' "' + node.systemId + '"' : '') + '>';
    }

    function serializeHtmlTag(doc) {
        var el = doc.documentElement,
            i, attr;
        var parts = ['<html'];
        for(i = 0; i < el.attributes.length; i++) {
            attr = el.attributes[i];
            if(attr.value !== undefined) {
                parts.push(attr.name + '="' + attr.value + '"');
            } else {
                parts.push(attr.name);
            }
        }
        return parts.join(" ") + ">";
    }

    function serializeHtmlBeforeCurrentScript(doc) {
        var innerHtml = doc.documentElement.innerHTML;
        var lastScript = innerHtml.lastIndexOf('<script>');
        return serializeDocType(doc) + serializeHtmlTag(doc) + innerHtml.substring(0, lastScript);
    }

    function createRemoteCallExpression(callback) {
        var argExpressions = Array.prototype.slice.call(arguments, 1) || [],
            callbackId = instrument.callbacks.length;
        instrument.callbacks.push(callback);
        return "(opener||parent).uitest.instrument.callbacks["+callbackId+"]("+argExpressions.join(",")+");";
    }

    function contentScriptHtml(content) {
        return '<script type="text/javascript">'+content+'</script>';
    }

    function urlScriptHtml(url) {
        return '<script type="text/javascript" src="'+url+'"></script>';
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
            return html.replace(/<head>/g, htmlArr.join(''));
        }

        function handleAppends(html, appends) {
            var htmlArr = [], i;
            for (i=0; i<appends.length; i++) {
                createScriptTagForPrependOrAppend(htmlArr, appends[i]);
            }
            htmlArr.push('</body>');
            return html.replace(/<\/body>/g, htmlArr.join(''));
        }

        function createScriptTagForPrependOrAppend(html, prependOrAppend) {
            if (isString(prependOrAppend)) {
                html.push(urlScriptHtml(prependOrAppend));
            } else {
                html.push(contentScriptHtml(createRemoteCallExpression(injectedCallback(prependOrAppend), 'window')));
            }
        }

        function injectedCallback(prepend) {
            return function(win) {
                return injector.inject(prepend, win, [win]);
            };
        }

        function handleScripts(html, config) {
            var requirejs = false;
            html = replaceScripts(html, function(scriptUrl) {
                if (!scriptUrl) return;
                
                if (scriptUrl.match(REQUIRE_JS_RE)) {
                    requirejs = true;
                    return contentScriptHtml(createRemoteCallExpression(function(win) {
                        handleRequireJsScript(win, scriptUrl);
                    }, "window"));
                }

                var matchingIntercepts = findMatchingIntercepts(scriptUrl, config.intercepts);
                if (!matchingIntercepts.empty) {
                    return contentScriptHtml(createRemoteCallExpression(function(win) {
                        handleInterceptScript(win, matchingIntercepts, scriptUrl);
                    }, "window"));
                }
            });

            return {
                requirejs: requirejs,
                html: html
            };
        }

        function handleRequireJsScript(win, scriptUrl) {
            var originalRequire = win.require;
            win.require = function (deps, originalCallback) {
                originalRequire(deps, function () {
                    // TODO execute the currentConfig.appends...

                    return originalCallback.apply(this, arguments);
                });
            };
            // TODO setup loading of scripts and applying the intercept scripts!

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
            loadScript(win, scriptUrl, resultCallback, false);

            function resultCallback(error, data) {
                if (error) {
                    throw error;
                }
                data = data.replace(NAMED_FUNCTION_RE, function(all, fnName) {
                    if (matchingInterceptsByName[fnName]) {
                        return all+'if (!'+fnName+'.delegate)return '+
                            createRemoteCallExpression(fnCallback, fnName, "this", "arguments");
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

                evalScript(win, data);
            }
        }

    }

    function loadScript(win, url, resultCallback, async) {
        var xhr = new win.XMLHttpRequest();
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    resultCallback(null, xhr.responseText + "//@ sourceURL=" + url);
                } else {
                    resultCallback(new Error("Error loading url " + url + ":" + xhr.statusText));
                }
            }
        };
        xhr.open("GET", url, async);
        xhr.send();
    }

    function evalScript(win, scriptContent) {
        win["eval"].call(win, scriptContent);
    }

    function replaceScripts(html, callback) {
        return html.replace(SCRIPT_RE, function (match, allElements, srcAttribute, textContent) {
            var result = callback(srcAttribute, textContent);
            if (result===undefined) {
                return match;
            }
            return result;
        });
    }

    function rewriteDocument(win, html) {
        var doc = win.document;
        doc.open();
        doc.write(html);
        doc.close();
    }

    function isString(obj) {
        return obj && obj.slice;
    }

    exports = {
        init: init,
        instrument: instrument,
        deactivateAndCaptureHtml: deactivateAndCaptureHtml,
        serializeDocType: serializeDocType,
        serializeHtmlTag: serializeHtmlTag,
        modifyHtmlWithConfig: modifyHtmlWithConfig,
        rewriteDocument: rewriteDocument,
        replaceScripts: replaceScripts,
        global: {
            uitest: {
                instrumet: instrument
            }
        }
    };
    return exports;
});