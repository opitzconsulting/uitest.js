uitest.define('jsParserFactory', ['regexParserFactory'], function(regexParserFactory) {
    var SINGLE_QUOTE_STRING = "sqstring",
        DOUBLE_QUOTE_STRING = "dqstring",
        LINE_COMMENT = "linecomment",
        BLOCK_COMMENT = "blockcomment",
        FUNCTION_START = "functionstart";

    return factory;

    function factory() {
        var parser = regexParserFactory();

        parser.addTokenType(SINGLE_QUOTE_STRING, "(')((?:[^'\\\\]|\\\\.)*)(')", "''", {1: "content"});
        parser.addTokenType(DOUBLE_QUOTE_STRING, '(")((?:[^"\\\\]|\\\\.)*)(")', '""', {1: "content"});
        parser.addTokenType(LINE_COMMENT, "(//)(.*)($)", "//", {1:"content"});
        parser.addTokenType(BLOCK_COMMENT, "(/\\*)([\\s\\S]*)(\\*/)", "/**/", {1: "content"});
        parser.addTokenType(FUNCTION_START, "(\\bfunction\\s*)(\\w+)([^\\{]*\\{)", "function fn(){", {1:"name"});

        return parser;
    }
});
