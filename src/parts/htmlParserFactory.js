uitest.define('htmlParserFactory', ['regexParserFactory'], function(regexParserFactory) {
    var COMMENT = "comment",
        CONTENT_SCRIPT = "contentscript",
        URL_SCRIPT = "urlscript",
        HEAD_START = "headstart",
        BODY_START = "bodystart",
        BODY_END = "bodyend",
        EMPTY_TAG_RE = /(<([^>\s]+)[^>]*)\/>/ig;

    return factory;

    function factory() {
        var parser = regexParserFactory();
        parser.addTokenType(COMMENT, "(<!--)((?:[^-]|-[^-])*?)(-->)", "<!---->", {1:"content"});
        parser.addTokenType(URL_SCRIPT, '(<script)([^>]*)(\\s+src\\s*=\\s*")([^"]*)(")([^>]*)(>[\\s\\S]*?</script>)', '<script src=""></script>', {1:"preAttrs", 3:"src", 5:"postAttrs"});
        parser.addTokenType(CONTENT_SCRIPT, "(<script)([^>]*)(>)([\\s\\S]*?)(</script>)", "<script></script>", {1:"attrs", 3:"content"});
        parser.addTokenType(HEAD_START, "(<head[^>]*>)", "<head>", []);
        parser.addTokenType(BODY_START, "(<body[^>]*>)", "<body>", []);
        parser.addTokenType(BODY_END, "(<\\s*/\\s*body\\s*>)", "</body>", []);

        var _parse = parser.parse,
            _transform = parser.transform;

        parser.parse = function(input) {
            input = makeEmptyTagsToOpenCloseTags(input);
            return _parse(input);
        };

        parser.transform = function(input, state, processors, resultCallback) {
            input = makeEmptyTagsToOpenCloseTags(input);
            return _transform(input, state, processors, resultCallback);
        };

        return parser;
    }

    // We unpack empty tags to open/close tags here,
    // so we have a normalized form for empty tags.
    // Also, we need html and not xhtml for rewriting a document
    // using script urls / document.open.
    function makeEmptyTagsToOpenCloseTags(html) {
        return html.replace(EMPTY_TAG_RE, function(match, openTag, tagName) {
            return openTag+"></"+tagName+">";
        });
    }
});
