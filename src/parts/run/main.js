uitest.define('run/main', ['urlParser', 'global','run/logger', 'run/config', 'run/htmlInstrumentor', 'run/testframe', 'run/loadSensor', 'utils'], function(urlParser, global, logger, runConfig, htmlInstrumentor, testframe, loadSensor, utils) {

    start(runConfig.url);
    return {
        start: start
    };

    // -------

    function start(url) {
        var now = utils.testRunTimestamp();
        loadSensor.init();
        url = urlParser.makeAbsoluteUrl(url, urlParser.uitestUrl());
        url = urlParser.cacheBustingUrl(url, now);
        url = url.replace("{now}",now);
        logger.log("opening url "+url);
        htmlInstrumentor.processHtml(url, function(error, html) {
            if (error) {
                logger.log("Error: "+JSON.stringify(error));
                throw error;
            }
            logger.log("rewriting url "+url);
            testframe.load(url, html);
        });
    }

});