uitest.define('run/main', ['documentUtils', 'urlParser', 'global','run/logger', 'run/config', 'run/htmlInstrumentor', 'run/testframe'], function(docUtils, urlParser, global, logger, runConfig, htmlInstrumentor, testframe) {

    start(runConfig.url);
    return;

    // -------

    function start(url) {
        var now = new global.Date().getTime();
        url = urlParser.makeAbsoluteUrl(url, urlParser.uitestUrl());
        url = urlParser.cacheBustingUrl(url, now);
        url = url.replace("{now}",now);
        logger.log("opening url "+url);
        htmlInstrumentor.processHtml(url, function(error, html) {
            if (error) {
                throw error;
            }
            logger.log("rewriting url "+url);
            testframe.load(url, html);
        });
    }

});