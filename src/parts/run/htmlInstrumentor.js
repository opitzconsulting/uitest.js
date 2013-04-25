uitest.define('run/htmlInstrumentor', ['fileLoader', 'run/logger', 'global', 'htmlParserFactory', 'run/eventSource', 'run/testframe', 'urlParser', 'utils', 'run/injector'], function(fileLoader, logger, global, htmlParserFactory, eventSource, testframe, urlParser, utils, injector) {

    var exports,
        htmlParser = htmlParserFactory();

    exports = {
        htmlParser: htmlParser,
        processHtml: processHtml
    };
    eventSource.on('html:headstart', emitAddPrepends);
    eventSource.on('html:bodystart', emitAddPrepends);
    eventSource.on('html:bodyend', emitAddAppends);
    eventSource.on('html:urlscript', emitInstrumentScript);
    eventSource.on('html:contentscript', emitInstrumentScript);

    return exports;

    function emitAddPrepends(htmlEvent, htmlEventDone) {
        var state = htmlEvent.state;
        if (state.addedPrepends) {
            htmlEventDone();
            return;
        }
        state.addedPrepends = true;
        emitAddPrependsAndAppends(htmlEvent, 'addPrepends', htmlEventDone);
    }

    function emitAddAppends(htmlEvent, htmlEventDone) {
        if (htmlEvent.token.addedAppends) {
            htmlEventDone();
            return;
        }
        htmlEvent.token.addedAppends = true;
        htmlEvent.stop();
        emitAddPrependsAndAppends(htmlEvent, 'addAppends', function(error) {
            if (error) {
                htmlEventDone(error);
                return;
            }
            htmlEvent.pushToken(htmlEvent.token);
            htmlEventDone();
        });
    }

    function emitAddPrependsAndAppends(htmlEvent, type, htmlEventDone) {
        logger.log(type+" after "+htmlEvent.type);
        eventSource.emit({
            type: type,
            handlers: [],
            state: htmlEvent.state
        }, done);

        function done(error, addPrependsOrAppendsEvent) {
            var i, handler;
            if (error) {
                htmlEventDone(error);
                return;
            }
            createScriptTokensForPrependsOrAppends(htmlEvent.pushToken, addPrependsOrAppendsEvent.handlers);
            htmlEventDone();
        }
    }

    function createScriptTokensForPrependsOrAppends(pushToken, prependsOrAppends) {
        var i, prependOrAppend, lastCallbackArr;
        for(i = 0; i < prependsOrAppends.length; i++) {
            prependOrAppend = prependsOrAppends[i];
            if(utils.isString(prependOrAppend)) {
                pushToken({
                    type: 'urlscript',
                    src: prependOrAppend
                });
                lastCallbackArr = null;
            } else {
                if(!lastCallbackArr) {
                    lastCallbackArr = [];
                    pushToken({
                        type: 'contentscript',
                        content: testframe.createRemoteCallExpression(injectedCallbacks(lastCallbackArr))
                    });
                }
                lastCallbackArr.push(prependOrAppend);
            }
        }
    }

    function injectedCallbacks(callbacks) {
        return function() {
            var i;
            for(i = 0; i < callbacks.length; i++) {
                injector.inject(callbacks[i]);
            }
        };
    }

    function emitInstrumentScript(htmlEvent, htmlEventDone) {
        if (htmlEvent.token.instrumented) {
            // prevent infinite loops!
            htmlEventDone();
            return;
        }
        var absUrl;
        if (htmlEvent.token.src) {
            absUrl = urlParser.makeAbsoluteUrl(htmlEvent.token.src, htmlEvent.state.htmlUrl);
        }
        eventSource.emit({
            type: 'instrumentScript',
            content: htmlEvent.token.content,
            src: absUrl,
            changed: false
        }, done);

        function done(error, instrumentScriptEvent) {
            // Allow event listeners to change the src of the script
            htmlEvent.token.src = instrumentScriptEvent.src;
            if (error || !instrumentScriptEvent.changed) {
                htmlEventDone(error);
                return;
            }
            var scriptAttrs;
            if (htmlEvent.token.type==='contentscript') {
                scriptAttrs = htmlEvent.token.attrs;
            } else {
                scriptAttrs = htmlEvent.token.preAttrs+htmlEvent.token.postAttrs;
            }
            htmlEvent.stop();
            htmlEvent.pushToken({
                type: 'contentscript',
                attrs: scriptAttrs,
                content: testframe.createRemoteCallExpression(execScript),
                instrumented: true
            });
            htmlEventDone();

            function execScript() {
                utils.evalScript(testframe.win(), absUrl, instrumentScriptEvent.content);
            }
        }
    }

    function processHtml(url, finishedCallback) {
        fileLoader(url, function(error, html) {
            if (error) {
                finishedCallback(error);
                return;
            }

            htmlParser.transform({
                input: html,
                state: {
                    htmlUrl: url
                },
                eventPrefix: 'html:',
                eventSource: eventSource
            },finishedCallback);
        });
    }
});