uitest.define('run/forceScriptRefreshPreprocessor', ['documentUtils', 'run/config', 'run/instrumentor', 'run/logger'], function(docUtils, runConfig, instrumentor, logger) {
    
    instrumentor.addPreprocessor(9999, forceScriptRefresh);
    return forceScriptRefresh;

    function forceScriptRefresh(html) {
        var now = runConfig.now;
        logger.log("forcing script refresh with timestamp "+runConfig.now);
        return docUtils.replaceScripts(html, function(parsedTag) {
            if(!parsedTag.scriptUrl) {
                return undefined;
            }
            return parsedTag.scriptOpenTag.replace(parsedTag.scriptUrl, parsedTag.scriptUrl+'?'+now)+"</script>";
        });
    }
});

