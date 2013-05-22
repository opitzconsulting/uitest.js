uitest.define('run/htmlInstrumentor', ['fileLoader', 'run/logger', 'global', 'htmlParserFactory', 'run/eventSource', 'run/testframe', 'urlParser', 'utils', 'run/injector'], function(fileLoader, logger, global, htmlParserFactory, eventSource, testframe, urlParser, utils, injector) {

    var exports,
        htmlParser = htmlParserFactory();

    exports = {
        htmlParser: htmlParser,
        processHtml: processHtml
    };
    eventSource.on('html:startTag', emitAddPrepends);
    eventSource.on('html:simpleTag', emitAddPrepends);
    eventSource.on('html:endTag', emitAddAppends);
    eventSource.on('html:startTag', emitInstrumentScript);
    eventSource.on('html:simpleTag', emitInstrumentScript);

    return exports;

    function emitAddPrepends(htmlEvent, htmlEventDone) {
        var state = htmlEvent.state;
        if (state.addedPrepends) {
            htmlEventDone();
            return;
        }
        if (htmlEvent.token.name!=='head' && htmlEvent.token.name!=='body') {
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
        if (htmlEvent.token.name!=='body') {
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
                    type: 'simpleTag',
                    name: 'script',
                    attrs:{
                        src:{value: prependOrAppend}
                    },
                    content: ''
                });
                lastCallbackArr = null;
            } else {
                if(!lastCallbackArr) {
                    lastCallbackArr = [];
                    pushToken({
                        type: 'simpleTag',
                        name: 'script',
                        content: testframe.createRemoteCallExpression(injectedCallbacks(lastCallbackArr)),
                        attrs: []
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
        if (htmlEvent.token.name!=='script') {
            htmlEventDone();
            return;
        }
        var absUrl;
        if (htmlEvent.token.attrs.src) {
            absUrl = urlParser.makeAbsoluteUrl(htmlEvent.token.attrs.src.value, htmlEvent.state.htmlUrl);
        }
        eventSource.emit({
            type: 'instrumentScript',
            content: htmlEvent.token.content,
            src: absUrl,
            changed: false
        }, done);

        function done(error, instrumentScriptEvent) {
            if (error) {
                htmlEventDone(error);
                return;
            }
            if (instrumentScriptEvent.changed) {
                htmlEvent.token.content = testframe.createRemoteCallExpression(execScript);
                delete htmlEvent.token.attrs.src;
            } else {
                // Still allow event listeners to change the src of the script
                if (htmlEvent.token.attrs.src) {
                    htmlEvent.token.attrs.src.value = instrumentScriptEvent.src;
                }
            }
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