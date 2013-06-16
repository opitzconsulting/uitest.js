uitest.define('run/htmlInstrumentor', ['fileLoader', 'run/logger', 'global', 'htmlParser', 'run/eventSource', 'run/testframe', 'urlParser', 'utils', 'run/injector'], function (fileLoader, logger, global, htmlParser, eventSource, testframe, urlParser, utils, injector) {

    var exports;

    exports = {
        htmlParser: htmlParser,
        processHtml: processHtml
    };
    eventSource.on('html:head:start', emitAddPrepends);
    eventSource.on('html:body:start', emitAddPrepends);
    eventSource.on('html:body:end', emitAddAppends);
    eventSource.on('html:script:simple', emitInstrumentScript);

    return exports;

    function emitAddPrepends(htmlEvent, htmlEventDone) {
        var state = htmlEvent.state;
        if (state.addedPrepends) {
            htmlEventDone();
            return;
        }
        state.addedPrepends = true;
        emitAddPrependsAndAppends(htmlEvent, 'addPrepends', htmlEvent.append, htmlEventDone);
    }

    function emitAddAppends(htmlEvent, htmlEventDone) {
        if (htmlEvent.token.addedAppends) {
            htmlEventDone();
            return;
        }
        htmlEvent.token.addedAppends = true;
        emitAddPrependsAndAppends(htmlEvent, 'addAppends', htmlEvent.prepend, htmlEventDone);
    }

    function emitAddPrependsAndAppends(htmlEvent, type, addArray, htmlEventDone) {
        logger.log(type + " after " + htmlEvent.type);
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
            createScriptTokensForPrependsOrAppends(addArray, addPrependsOrAppendsEvent.handlers);
            htmlEventDone();
        }
    }

    function createScriptTokensForPrependsOrAppends(addArray, prependsOrAppends) {
        var i, prependOrAppend, lastCallbackArr;
        for (i = 0; i < prependsOrAppends.length; i++) {
            prependOrAppend = prependsOrAppends[i];
            if (utils.isString(prependOrAppend)) {
                addArray.push({
                    type: 'simple',
                    name: 'script',
                    attrs: {
                        src: prependOrAppend
                    },
                    content: ''
                });
                lastCallbackArr = null;
            } else {
                if (!lastCallbackArr) {
                    lastCallbackArr = [];
                    addArray.push({
                        type: 'simple',
                        name: 'script',
                        attrs: {},
                        content: testframe.createRemoteCallExpression(injectedCallbacks(lastCallbackArr))
                    });
                }
                lastCallbackArr.push(prependOrAppend);
            }
        }
    }

    function injectedCallbacks(callbacks) {
        return function () {
            var i;
            for (i = 0; i < callbacks.length; i++) {
                injector.inject(callbacks[i]);
            }
        };
    }

    function emitInstrumentScript(htmlEvent, htmlEventDone) {
        if (htmlEvent.token.name !== 'script') {
            htmlEventDone();
            return;
        }
        var absUrl;
        if (htmlEvent.token.attrs.src) {
            absUrl = urlParser.makeAbsoluteUrl(htmlEvent.token.attrs.src, htmlEvent.state.htmlUrl);
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
                    htmlEvent.token.attrs.src = instrumentScriptEvent.src;
                }
            }
            htmlEventDone();

            function execScript() {
                utils.evalScript(testframe.win(), absUrl, instrumentScriptEvent.content);
            }
        }
    }

    function processHtml(url, finishedCallback) {
        fileLoader(url, function (error, html) {
            if (error) {
                finishedCallback(error);
                return;
            }

            htmlParser({
                input: html,
                state: {
                    htmlUrl: url
                },
                eventPrefix: 'html:',
                eventSource: eventSource
            }, finishedCallback);
        });
    }
});