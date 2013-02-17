uitest.define('run/lesserThanIe10Preprocessor', ['run/instrumentor', 'run/logger', 'documentUtils'], function(instrumentor, logger, docUtils) {
    instrumentor.addPreprocessor(-9999, fixIeLesserThan10ScriptExecutionOrderWithDocumentWrite);
    return fixIeLesserThan10ScriptExecutionOrderWithDocumentWrite;

    // IE<=9 executes scripts with src urls when doing a document.write
    // out of the normal order. Because of this, we are
    // replacing them by an inline script that executes those
    // scripts using eval at the right place.
    function fixIeLesserThan10ScriptExecutionOrderWithDocumentWrite(html, browserFlags) {
        if (!browserFlags.ieLt10) {
            return html;
        }
        logger.log("applying ie<10 bugfix");
        return docUtils.replaceScripts(html, function(parsedTag) {
            if(!parsedTag.scriptUrl) {
                return undefined;
            }
            var scriptOpenTag = parsedTag.scriptOpenTag.replace(parsedTag.srcAttribute, '');
            return scriptOpenTag + instrumentor.createRemoteCallExpression(function(win) {
                docUtils.loadAndEvalScriptSync(win, parsedTag.scriptUrl);
            }, "window") + '</script>';
        });
    }

    
});
