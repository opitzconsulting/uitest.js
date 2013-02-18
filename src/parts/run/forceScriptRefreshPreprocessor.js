uitest.define('run/forceScriptRefreshPreprocessor', ['documentUtils', 'run/instrumentor', 'run/logger', 'utils'], function(docUtils, instrumentor, logger, utils) {
    
    instrumentor.addPreprocessor(9999, forceScriptRefresh);
    return forceScriptRefresh;

    function forceScriptRefresh(html) {
        var now = utils.testRunTimestamp();
        logger.log("forcing script refresh with timestamp "+now);
        return docUtils.replaceScripts(html, function(parsedTag) {
            if(!parsedTag.scriptUrl) {
                return undefined;
            }
            return parsedTag.scriptOpenTag.replace(parsedTag.scriptUrl, parsedTag.scriptUrl+'?'+now)+"</script>";
        });
    }
});

