uitest.define('htmlParser', ['utils'], function (utils) {
    var ATTR_RE = /([\w_-]+)(\s*=\s*"([^"]*))?/g,
        TAG_MULTI_RE = [
            {
                type: "start",
                re: '<\\s*(\\w+)([^>]*?)(/)?>',
                groupCount: 3,
                parse: parseStartTag
            },
            {
                type: "end",
                re: '</\\s*(\\w+)\\s*>',
                groupCount: 1,
                parse: parseEndTag
            }
        ],
        simpleTags = {
            script: true
        };

    return transform;

    function parseStartTag(match, tokens) {
        var name = match[1],
            attrsUnparsed = match[2],
            empty = match[3],
            attrs = {},
            attrMatch;
        while (attrMatch = ATTR_RE.exec(attrsUnparsed)) {
            attrs[attrMatch[1]] = attrMatch[3];
        }
        tokens.push({
            type: 'start',
            name: name,
            attrs: attrs
        });
        if (empty) {
            tokens.push({
                name: name,
                type: 'end'
            });
        }
    }

    function parseEndTag(match, tokens) {
        var name = match[1];
        tokens.push({
            type: 'end',
            name: name
        });
    }

    function transform(data, transformDone) {
        var input = data.input,
            state = data.state || {},
            eventSource = data.eventSource,
            tokens = parse(input),
            resultTokens = [];

        loopTokens(tokens, function (error) {
            transformDone(error, serialize(resultTokens));
        });

        function loopTokens(tokens, loopDone) {
            utils.asyncLoop(tokens, loopHandler, loopDone);

            function loopHandler(entry, loopHandlerDone) {
                var token = entry.item;
                if (stringTokenDone(token)) {
                    return;
                }
                eventSource.emit(createEvent(token), eventDone);

                function stringTokenDone(token) {
                    if (typeof token === 'string') {
                        resultTokens.push(token);
                        loopHandlerDone(null);
                        return true;
                    }
                }

                function createEvent(token) {
                    return {
                        type: 'html:' + token.name + ':' + token.type,
                        token: token,
                        state: state,
                        prepend: [],
                        append: []
                    };
                }

                function eventDone(error, event) {
                    if (error) {
                        loopHandlerDone(error);
                        return;
                    }
                    loopTokens(event.prepend, function (error) {
                        if (error) {
                            loopHandlerDone(error);
                            return;
                        }
                        resultTokens.push(event.token);
                        loopTokens(event.append, function (error) {
                            if (error) {
                                loopHandlerDone(error);
                                return;
                            }
                            loopHandlerDone();
                        });
                    });
                }
            }
        }
    }

    function parse(input) {
        var tokens = splitIntoOpenCloseTags(input);
        return joinSimpleTags(tokens);
    }

    function splitIntoOpenCloseTags(input) {
        var multiRe = utils.multiRegex(TAG_MULTI_RE, "ig"),
            match,
            parsedMatch,
            tokens = [],
            lastMatchEnd = 0;
        while (match = multiRe.regex.exec(input)) {
            addOtherIfNeeded(match.index, match[0].length);
            parsedMatch = multiRe.parseMatch(match);
            parsedMatch.spec.parse(parsedMatch.match, tokens);
        }
        addOtherIfNeeded(input.length, 0);
        return tokens;

        function addOtherIfNeeded(matchStart, matchLen) {
            if (matchStart > lastMatchEnd) {
                tokens.push(input.substring(lastMatchEnd, matchStart));
            }
            lastMatchEnd = matchStart + matchLen;
        }
    }

    function joinSimpleTags(tokens) {
        var i = 0,
            token,
            resultTokens = [];
        while (token = readToken()) {
            if (token.type === 'start' && simpleTags[token.name.toLowerCase()]) {
                resultTokens.push(readSimpleTag(token));
            } else {
                resultTokens.push(token);
            }
        }
        return resultTokens;

        function readToken() {
            return tokens[i++];
        }

        function readSimpleTag(startTagToken) {
            var name = startTagToken.name,
                content = [],
                nextToken;
            startTagToken.type = 'simple';
            nextToken = readToken();
            if (typeof nextToken === 'string') {
                startTagToken.content = nextToken;
                nextToken = readToken();
            }
            if (nextToken.type !== 'end' || nextToken.name !== name) {
                throw new Error("expected end tag " + name + " but got " + nextToken);
            }
            return startTagToken;
        }
    }

    function serialize(tokens) {
        var i,
            token,
            result = [];
        for (i = 0; i < tokens.length; i++) {
            token = tokens[i];
            if (typeof token === 'string') {
                result.push(token);
            } else if (token.type === 'start') {
                serializeStartTag(token);
            } else if (token.type === 'simple') {
                serializeSimpleTag(token);
            } else if (token.type === 'end') {
                serializeEndTag(token);
            }
        }
        return result.join('');

        function serializeStartTag(token) {
            var attrName, attrValue;
            result.push('<', token.name);
            for (attrName in token.attrs) {
                attrValue = token.attrs[attrName];
                result.push(' ', attrName);
                if (attrValue) {
                    result.push('="', attrValue, '"');
                }
            }
            result.push('>');
        }

        function serializeEndTag(token) {
            result.push('</', token.name, '>');
        }

        function serializeSimpleTag(token) {
            serializeStartTag(token);
            if (token.content) {
                result.push(token.content);
            }
            serializeEndTag(token);
        }

    }
});
