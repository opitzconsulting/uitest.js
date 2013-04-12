uitest.define('run/feature/cacheBuster', ['documentUtils', 'run/htmlInstrumentor', 'run/logger', 'utils', 'urlParser', 'run/requirejsInstrumentor'], function(docUtils, docInstrumentor, logger, utils, urlParser, requirejsInstrumentor) {

    var now = utils.testRunTimestamp();
    logger.log("forcing script refresh with timestamp "+now);

    htmlPreProcessor.priority = 9999;
    docInstrumentor.addPreProcessor(htmlPreProcessor);
    requirejsEventHandler.priority = 9999;
    requirejsInstrumentor.addEventListener(requirejsEventHandler);

    return {
        htmlPreProcessor: htmlPreProcessor,
        requirejsEventHandler: requirejsEventHandler
    };

    function requirejsEventHandler(event, control) {
        if (event.type==='load') {
            event.url = urlParser.cacheBustingUrl(event.url, now);
        }
        control.next();
    }

    function htmlPreProcessor(event, control) {
        if (event.token.type==='urlscript') {
            event.token.src = urlParser.cacheBustingUrl(event.token.src, now);
        }
        control.next();
    }
});

