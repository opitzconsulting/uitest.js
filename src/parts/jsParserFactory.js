uitest.define('jsParserFactory', ['regexParserFactory'], function(regexParserFactory) {
    var lexemeSpecs = [
        // needs to be before quote/dquote/slash to be recognized first!
        {type:"escape", re:'\\\\["\'/]', groupCount: 0},
        {type:"quote", re:"'", groupCount: 0},
        {type:"dquote", re:'"', groupCount: 0},
        {type:"commentStart", re:'/\\*', groupCount: 0},
        {type:"commentEnd", re:'\\*/', groupCount: 0},
        {type:"lineCommentStart", re:'//', groupCount: 0},
        {type:"newline", re:'\n', groupCount: 0},
        {type:"namedFunctionStart", re: "\\bfunction\\s*(\\w+)[^\\{]*\\{", groupCount:1},
        // Special marker for:
        //   var location
        //   var x, location
        //   location = 
        {type:"location", re:'((var)\\s+|(\\,)\\s*|[\\s\\.]|^)location(\\s*(=)|[\\s\\.\\[;]|$)', groupCount:5},
        // needs to be after commentStart, commentEnd so that they are recognized first.
        {type:"slash", re:"/", groupCount: 0}
    ];

    var lexemeStartParsers = {
        lineCommentStart: parseLineComment,
        commentStart:parseBlockComment,
        slash:parseRegex,
        quote:parseString,
        dquote:parseString,
        doubleQuote:parseString,
        location: parseLocation,
        namedFunctionStart:parseNamedFunctionStart
    };

    var parser = regexParserFactory(lexemeSpecs, lexemeStartParsers, {}, false);

    // TODO refactor to a non factory method!
    return function() {
        return parser;
    };

    function parseLineComment(lexerIter, output) {
        output.addMergedToken('newline', 'comment');
    }

    function parseBlockComment(lexerIter, output) {
        output.addMergedToken('commentEnd', 'comment');
    }

    function parseString(lexerIter, output) {
        var quoteType = lexerIter.current.type;
        output.addMergedToken(quoteType, 'string');
    }

    function parseRegex(lexerIter, output) {
        output.addMergedToken("slash", 're');
    }

    function parseLocation(lexerIter, output) {
        var match = lexerIter.current.match;
        if (match[2] || match[3] || match[5]) {
            // Matched here:
            //   var location
            //   , location
            //   location = 
            output.addOtherToken();
        } else {
            if (match[1]) {
                output.addToken({
                    type: 'other',
                    match: match[1]
                });
            }
            output.addToken({
                type: 'location',
                match: 'location'
            });
            if (match[4]) {
                output.addToken({
                    type: 'other',
                    match: match[4]
                });
            }
        }
    }

    function parseNamedFunctionStart(lexerIter, output) {
        var match = lexerIter.current.match;
        output.addToken({
            type: 'namedFunctionStart',
            name: match[1],
            match:match[0]
        });
    }
});
