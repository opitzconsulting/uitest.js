uitest.define('run/namedFunctionInstrumentor', ['run/eventSource', 'run/injector', 'annotate', 'run/config', 'urlParser', 'run/testframe', 'run/scriptInstrumentor'], function(eventSource, injector, annotate, runConfig, urlParser, testframe, scriptInstrumentor) {
    var FUNCTION_START = "functionstart";

    scriptInstrumentor.jsParser.addTokenType(FUNCTION_START, "(\\bfunction\\s*)(\\w+)([^\\{]*\\{)", "function fn(){", {1:"name"});
    eventSource.on('js:'+FUNCTION_START, onFunctionStart);

    return onFunctionStart;

    function onFunctionStart(event, done) {
        var token = event.token,
            state = event.state;
        var intercept = findMatchingInterceptByName(token.name, state.scriptUrl);
        if (!intercept) {
            done();
            return;
        }
        event.pushToken({
            type: 'other',
            match: 'if (!' + token.name + '.delegate)return ' + testframe.createRemoteCallExpression(fnCallback, "window", token.name, "this", "arguments")
        });
        done();
        return;

        function fnCallback(win, fn, self, args) {
            var originalArgNames = annotate(fn),
                originalArgsByName = {},
                $delegate = {
                    fn: fn,
                    name: token.name,
                    self: self,
                    args: args
                },
                i;
            for(i = 0; i < args.length; i++) {
                originalArgsByName[originalArgNames[i]] = args[i];
            }
            fn.delegate = true;
            try {
                return injector.inject(intercept.callback, self, [originalArgsByName,
                {
                    $delegate: $delegate
                },
                win]);
            } finally {
                fn.delegate = false;
            }
        }
    }

    function findMatchingInterceptByName(fnName, scriptUrl) {
        var i,
            intercepts = runConfig.intercepts,
            fileName = urlParser.filenameFor(scriptUrl||'');

        if(intercepts) {
            for(i = 0; i < intercepts.length; i++) {
                if(intercepts[i].fn === fnName && intercepts[i].script === fileName) {
                    return intercepts[i];
                }
            }
        }
    }
});
