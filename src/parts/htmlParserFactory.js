uitest.define('htmlParserFactory', ['regexParserFactory'], function(regexParserFactory) {
    var attrRe = /(\w+)(\s*=\s*"([^"]*))?/g;
    var lexemeSpecs = [
        {type:"commentStart", re: '<!--', groupCount:0},
        {type:"commentEnd", re: '-->', groupCount:0},
        {type:"startTag", re: '<\\s*(\\w+)([^>]*?)(/)?>', groupCount:3},
        {type:"endTag", re: '</\\s*(\\w+)\\s*>', groupCount:1}
    ];
    var lexemeStartParsers = {
        commentStart: commentParser,
        startTag: startTagParser,
        endTag: endTagParser
    };
    var tokenSerializers = {
        startTag: startTagSerializer,
        endTag: endTagSerializer,
        simpleTag: simpleTagSerializer
    };
    var lastStartTagOutputIndex;

    // TODO: Test ignoreCase!    
    var parser = regexParserFactory(lexemeSpecs, lexemeStartParsers, tokenSerializers, true);

    // TODO remove factory
    return function() {
        return parser;
    };

    function commentParser(lexemesIter, output) {
        output.addMergedToken("commentEnd", "comment");
    }

    function startTagParser(lexemesIter, output) {
        var match = lexemesIter.current.match;
        var token = {
            name: match[1],
            attrs: parseAttrs(match[2]),
            type: 'startTag'
        };
        if (match[3]) {
            // empty xhtml-style tag.
            token.type = 'simpleTag';
            token.content = '';
        }
        lastStartTagOutputIndex = output.tokens.length;
        output.addToken(token);
    }

    function parseAttrs(input) {
        var match, attrs = {}, i=0;
        while (match = attrRe.exec(input)) {
            attrs[match[1]] = {
                value: match[3],
                index: i++
            };
        }
        return attrs;
    }

    function endTagParser(lexemesIter, output) {
        var tagName = lexemesIter.current.match[1];
        var laststartTagToken = output.tokens[lastStartTagOutputIndex],
            i, content = [];
        if (laststartTagToken && laststartTagToken.name === tagName) {
            laststartTagToken.type = 'simpleTag';
            for (i=lastStartTagOutputIndex; i<output.tokens.length; i++) {
                content.push(output.tokens[i].match);
            }
            output.tokens.splice(lastStartTagOutputIndex+1, output.tokens.length-lastStartTagOutputIndex);
            laststartTagToken.content = content.join('');
            laststartTagToken = null;
        } else {
            output.addToken({
                type: 'endTag',
                name: lexemesIter.current.match[1]
            });
        }
    }

    function startTagSerializer(token) {
        var parts = ['<', token.name], i, attr, sortedAttrNames = [], attrName;
        if (token.attrs) {
            for (attrName in token.attrs) {
                sortedAttrNames.push(attrName);
            }
            sortedAttrNames.sort(function(attrName) {
                return token.attrs[attrName].index;
            });
            for (i=0; i<sortedAttrNames.length; i++) {
                attrName = sortedAttrNames[i];
                attr = token.attrs[attrName];
                parts.push(' ');
                parts.push(attrName);
                if (attr.value) {
                    parts.push('="');
                    parts.push(attr.value);
                    parts.push('"');
                }
            }
        }
        parts.push('>');
        return parts.join('');
    }

    function endTagSerializer(token) {
        return "</"+token.name+">";
    }

    function simpleTagSerializer(token) {
        return startTagSerializer(token)+token.content+endTagSerializer(token);
    }
});
