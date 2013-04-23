uitest.define('run/scriptInstrumentor', ['run/eventSource', 'fileLoader', 'run/logger', 'jsParserFactory'], function(eventSource, fileLoader, logger, jsParserFactory) {
    var jsParser = jsParserFactory();

    eventSource.on('instrumentScript', instrumentScript);

    return {
        jsParser: jsParser
    };

    function instrumentScript(event, done) {
        if (!event.content && event.src) {
            fileLoader(event.src, function(error, scriptContent) {
                if (error) {
                    done(error);
                } else {
                    scriptContentLoaded(scriptContent);
                }
            });
        } else {
            scriptContentLoaded(event.content);
        }

        function scriptContentLoaded(scriptContent) {
            jsParser.transform({
                input: scriptContent,
                eventSource: eventSource,
                eventPrefix: 'js:',
                state: {
                    scriptUrl: event.src
                }
            }, jsTransformDone);

            function jsTransformDone(error, newScriptContent) {
                event.content = newScriptContent;
                event.changed = newScriptContent !== scriptContent;
                done(error, event);
            }
        }
    }
});