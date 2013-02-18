uitest.define('run/lesserThanIe10Preprocessor', ['run/instrumentor', 'run/logger', 'documentUtils', 'run/testframe'], function(instrumentor, logger, docUtils, testframe) {
    instrumentor.addPreprocessor(-9999, fixIeLesserThan10ScriptExecutionOrderWithDocumentWrite);
    return fixIeLesserThan10ScriptExecutionOrderWithDocumentWrite;

    // IE<=9 executes scripts with src urls when doing a document.write
    // out of the normal order. Because of this, we are
    // replacing them by an inline script that executes those
    // scripts using eval at the right place.


    function fixIeLesserThan10ScriptExecutionOrderWithDocumentWrite(html) {
        if (!isIeLesserThan10(testframe )) {
            return html;
        }
        logger.log("applying ie<10 bugfix");
        var newHtml = docUtils.replaceScripts(html, function(parsedTag) {
            if(!parsedTag.scriptUrl) {
                return undefined;
            }
            var scriptOpenTag = parsedTag.scriptOpenTag.replace(parsedTag.srcAttribute, '');
            return scriptOpenTag + instrumentor.createRemoteCallExpression(function(win) {
                docUtils.loadAndEvalScriptSync(win, parsedTag.scriptUrl);
            }, "window") + '</script>';
        });
        return newHtml;
    }

    function isIeLesserThan10(frame) {
        if(frame.navigator.appName.indexOf("Internet Explorer") !== -1) { //yeah, he's using IE
            return frame.navigator.appVersion.indexOf("MSIE 1") === -1; //v10, 11, 12, etc. is fine
        }
        return false;
    }
});