uitest.define('htmlParserFactory', ['regexParserFactory'], function(regexParserFactory) {
    var attrRe = /([\w_-]+)(\s*=\s*"([^"]*))?/g;
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
    var simpleTags = {
        script: true
    };

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
        var name = match[1];
        var isSimpleTag = simpleTags[name.toLowerCase()];
        var token = {
            name: name,
            attrs: parseAttrs(match[2]),
            type: 'startTag'
        };
        output.addToken(token);
        if (match[3]) {
            // empty xhtml-style tag.
            if (isSimpleTag) {
                token.type = 'simpleTag';
                token.content = '';
            } else {
                output.addToken({
                    type: 'endTag',
                    name: name
                });
            }
        } else if (isSimpleTag) {
            var content = [],
                lexeme;
            lexemesIter.next();
            for (lexeme = lexemesIter.current; lexeme && lexeme.type!=='endTag'; lexeme = lexemesIter.next()) {
                content.push(lexeme.match[0]);
            }
            token.content = content.join('');
            token.type='simpleTag';
        }
        lastStartTagOutputIndex = output.tokens.length;
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
        output.addToken({
            type: 'endTag',
            name: tagName
        });
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
        var res = [
            startTagSerializer(token)
        ];
        if (token.content) {
            res.push(token.content);
        }
        res.push(endTagSerializer(token));
        return res.join('');
    }
});
