uitest.define('run/htmlInstrumentor', ['documentUtils', 'run/config', 'run/logger', 'global', 'run/testframe', 'run/sniffer', 'htmlParserFactory'], function(docUtils, runConfig, logger, global, testframe, sniffer, htmlParserFactory) {

    var exports,
        preProcessors = [],
        htmlParser = htmlParserFactory();

    exports = {
        addPreProcessor: addPreProcessor,
        htmlParser: htmlParser,
        processHtml: processHtml
    };
    return exports;

    function processHtml(url, finishedCallback) {
        docUtils.loadFile(url, function(error, html) {
            if (error) {
                finishedCallback(error);
                return;
            }

            htmlParser.transform(html,{
                url: url
            },preProcessors,finishedCallback);
        });
    }

    function addPreProcessor(preProcessor) {
        preProcessors.push(preProcessor);
    }
});