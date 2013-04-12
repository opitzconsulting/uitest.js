uitest.define('run/scriptInstrumentor', ['run/htmlInstrumentor', 'run/injector', 'documentUtils', 'run/logger', 'run/testframe', 'jsParserFactory', 'run/requirejsInstrumentor'], function(docInstrumentor, injector, docUtils, logger, testframe, jsParserFactory, requirejsInstrumentor) {
    var preProcessors = [],
        jsParser = jsParserFactory();

    docInstrumentor.addPreProcessor(preprocessHtml);
    requirejsInstrumentor.addEventListener(requirejsEventHandler);

    return {
        addPreProcessor: addPreProcessor,
        jsParser: jsParser
    };

    function addPreProcessor(processor) {
        preProcessors.push(processor);
    }

    function preprocessHtml(event, control) {
        var token = event.token;

        if (token.type==='urlscript') {
            docUtils.loadScript(testframe.win(), token.src, function(error, scriptContent) {
                if (error) {
                    control.stop(error);
                } else {
                    onScriptLoaded(token.src, token.preAttrs + token.postAttrs, scriptContent);
                }
            });
        } else if (token.type === 'contentscript') {
            onScriptLoaded(null, token.attrs, token.content);
        } else {
            control.next();
        }
        return;

        function onScriptLoaded(scriptSrc, scriptAttrs, scriptContent) {
            jsParser.transform(scriptContent,{
                src: scriptSrc
            },preProcessors,resultCallback);

            function resultCallback(errors, newScriptContent) {
                if (errors) {
                    control.stop(errors);
                    return;
                }
                if (newScriptContent===scriptContent) {
                    control.next();
                    return;
                }
                logger.log("intercepting "+scriptSrc);
                event.pushToken({
                    type: 'contentscript',
                    content: docInstrumentor.createRemoteCallExpression(function(win) {
                        docUtils.evalScript(win, newScriptContent);
                    }, "window"),
                    attrs: scriptAttrs
                });
                control.stop();
            }
        }
    }

    function requirejsEventHandler(event, control) {
        if (event.type !== 'load') {
            control.next();
            return;
        }
        var url = event.url;
        docUtils.loadScript(testframe.win(), url, function(error, scriptContent) {
            if (error) {
                control.stop(error);
            }
            jsParser.transform(scriptContent,{
                src:url
            },preProcessors,resultCallback);

            function resultCallback(errors, newScriptContent) {
                if (errors) {
                    control.stop(errors);
                    return;
                }
                if (newScriptContent===scriptContent) {
                    control.next();
                    return;
                }
                logger.log("intercepting "+url);
                var error;
                try {
                    docUtils.evalScript(testframe.win(), newScriptContent);
                } catch (e) {
                    error = e;
                }
                control.stop(error);
            }
        });
    }
});
