uitest.define('run/feature/cacheBuster', ['run/eventSource', 'run/logger', 'utils', 'urlParser'], function(eventSource, logger, utils, urlParser) {

    var now = utils.testRunTimestamp();
    logger.log("forcing script refresh with timestamp "+now);
    eventSource.on('instrumentScript', instrumentScript);

    return instrumentScript;

    function instrumentScript(event, done) {
        if (event.src) {
            event.src = urlParser.cacheBustingUrl(event.src, now);
        }
        done();
    }
});

