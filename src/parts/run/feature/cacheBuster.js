uitest.define('run/feature/cacheBuster', ['documentUtils', 'run/instrumentor', 'run/logger', 'utils', 'urlParser', 'run/requirejsScriptAdder'], function(docUtils, instrumentor, logger, utils, urlParser, requirejsScriptAdder) {

    var now = utils.testRunTimestamp();
    logger.log("forcing script refresh with timestamp "+now);

    instrumentor.addPreprocessor(9999, forceScriptRefresh);
    requirejsScriptAdder.addLoadInterceptor(9999, forceScriptRefreshLoadInterceptor);

    return {
        forceScriptRefresh: forceScriptRefresh,
        forceScriptRefreshLoadInterceptor: forceScriptRefreshLoadInterceptor
    };

    function forceScriptRefreshLoadInterceptor(url, callback) {
        return urlParser.cacheBustingUrl(url, now);
    }

    function forceScriptRefresh(html) {
        return docUtils.replaceScripts(html, function(parsedTag) {
            if(!parsedTag.scriptUrl) {
                return undefined;
            }
            var url = urlParser.cacheBustingUrl(parsedTag.scriptUrl, now);
            return parsedTag.scriptOpenTag.replace(parsedTag.scriptUrl, url)+"</script>";
        });
    }
});

