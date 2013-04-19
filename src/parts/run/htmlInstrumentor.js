uitest.define('run/htmlInstrumentor', ['fileLoader', 'run/config', 'run/logger', 'global', 'run/testframe', 'sniffer', 'htmlParserFactory'], function(fileLoader, runConfig, logger, global, testframe, sniffer, htmlParserFactory) {

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
        fileLoader(url, function(error, html) {
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