uitest.define('run/scriptAdder', ['run/config', 'run/htmlInstrumentor', 'documentUtils', 'run/injector', 'annotate', 'run/logger', 'urlParser', 'utils', 'run/requirejsInstrumentor', 'run/testframe'], function(runConfig, docInstrumentor, docUtils, injector, annotate, logger, urlParser, utils, requirejsInstrumentor, testframe) {
    // This needs to be before the scriptInstrumentor, so
    // the added scripts are also processed!
    preprocessHtml.priority = 10;
    docInstrumentor.addPreProcessor(preprocessHtml);
    requirejsInstrumentor.addEventListener(requirejsEventListener);

    function preprocessHtml(event, control) {
        if (handlePrepends(event, control)) {
            return;
        }
        if (handleAppends(event, control)) {
            return;
        }
        control.next();
    }

    function handlePrepends(event, control) {
        var state = event.state,
            token = event.token;

        if (state.addedPrepends) {
            return;
        }
        if (!runConfig.prepends || !runConfig.prepends.length) {
            return;
        }
        if (token.type !== 'headstart' && token.type !== 'bodystart') {
            return;
        }
        logger.log("adding prepends after "+token.type);
        state.addedPrepends = true;
        createScriptTokensForPrependsOrAppends(event.pushToken, runConfig.prepends);
        control.next();
        return true;
    }

    function handleAppends(event, control) {
        var state = event.state,
            token = event.token;

        if (token.type!=='bodyend') {
            return;
        }
        if (!runConfig.appends || !runConfig.appends.length || state.requirejs) {
            return;
        }
        logger.log("adding appends before "+token.type);
        createScriptTokensForPrependsOrAppends(event.pushToken, runConfig.appends);
        control.next();
        return true;
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
                        content: testframe.createRemoteCallExpression(injectedCallbacks(lastCallbackArr), 'window')
                    });
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

    function requirejsEventListener(event, control) {
        if (event.type!=='require') {
            control.next();
            return;
        }
        var i = 0,
            appends = runConfig.appends,
            win = event.win;

        logger.log("adding appends using requirejs");
        execNext();

        function execNext() {
            var append;
            if(i >= appends.length) {
                control.next();
            } else {
                append = appends[i++];
                if(utils.isString(append)) {
                    event.require([append], execNext);
                } else {
                    injector.inject(append, win, [win]);
                    execNext();
                }
            }
        }
    }

    return {
        preprocessHtml: preprocessHtml,
        requirejsEventListener: requirejsEventListener,
        handlePrepends: handlePrepends,
        handleAppends: handleAppends
    };
});