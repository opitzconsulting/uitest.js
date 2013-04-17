uitest.define('run/namedFunctionInstrumentor', ['run/scriptInstrumentor', 'run/injector', 'annotate', 'run/config', 'urlParser', 'run/testframe'], function(scriptInstrumentor, injector, annotate, runConfig, urlParser, testframe) {
    scriptInstrumentor.addPreProcessor(preProcessJavaScript);

    return preProcessJavaScript;

    function preProcessJavaScript(event, control) {
        var token = event.token,
            state = event.state;

        if (token.type!=='functionstart') {
            control.next();
            return;
        }
        var intercept = findMatchingInterceptByName(token.name, state.src);
        if (!intercept) {
            control.next();
            return;
        }
        event.pushToken({
            type: 'other',
            match: 'if (!' + token.name + '.delegate)return ' + testframe.createRemoteCallExpression(fnCallback, "window", token.name, "this", "arguments")
        });
        control.next();
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
