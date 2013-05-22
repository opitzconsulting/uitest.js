uitest.define('regexParserFactory', ['utils'], function(utils) {

    return createParser;

    function createParser(lexemeSpecs, lexemeStartParsers, tokenSerializers, ignoreCase) {
        var compiledLexer = compileLexer(lexemeSpecs);
        return {
            parse: parse,
            serialize: serialize,
            transform: transform
        };

        function serialize(tokens) {
            var parts = new Array(tokens.length),
                i, token, serializer, tokenStr;
            for (i = 0; i < tokens.length; i++) {
                token = tokens[i];
                serializer = tokenSerializers[token.type];
                if (serializer) {
                    tokenStr = serializer(token);
                } else {
                    tokenStr = tokens[i].match;
                }
                parts.push(tokenStr);
            }
            return parts.join('');
        }

        function parse(input) {
            var lexemes = compiledLexer(input);
            return parseLexemes(lexemes, lexemeStartParsers);
        }

        function transform(data, transformDone) {
            var input = data.input,
                state = data.state || {},
                eventSource = data.eventSource,
                eventPrefix = data.eventPrefix || '',
                tokens = parse(input),
                resultTokens = [];

            utils.asyncLoop(tokens, loopHandler, loopDone);

            function loopDone(error) {
                transformDone(error, serialize(resultTokens));
            }

            function loopHandler(entry, loopHandlerDone) {
                var token = entry.item,
                    tokenIndex = entry.index,
                    pushTokenInsertPos = tokenIndex + 1;
                eventSource.emit({
                    type: eventPrefix + token.type,
                    token: token,
                    state: state,
                    pushToken: pushToken
                }, eventDone);

                function eventDone(error, event) {
                    if (!event.stopped && !error) {
                        resultTokens.push(token);
                    }
                    loopHandlerDone(error);
                }

                function pushToken(token) {
                    tokens.splice(pushTokenInsertPos++, 0, token);
                }
            }
        }
    }

    function parseLexemes(lexemes, lexemeStartParsers) {
        var lexerIter = iterator(lexemes),
            lexeme,
            output = [],
            lexemParser,
            outputAdder = {
                addToken: addToken,
                addMergedToken: addMergedToken,
                addOtherToken: addOtherToken,
                tokens: output
            };
        while (lexeme = lexerIter.next()) {
            lexemParser = lexemeStartParsers[lexeme.type];
            if (lexemParser) {
                lexemParser(lexerIter, outputAdder);
            } else {
                outputAdder.addOtherToken();
            }
        }
        return concatOtherTokens(output);

        function addMergedToken(lexemeType, outputType) {
            var parts = [];
            do {
                parts.push(lexerIter.current.match[0]);
                lexerIter.next();
            } while (lexerIter.current && lexerIter.current.type !== lexemeType);
            if (lexerIter.current) {
                parts.push(lexerIter.current.match[0]);
            }
            output.push({
                type: outputType,
                match: parts.join('')
            });
        }

        function addOtherToken() {
            if (lexerIter.current) {
                output.push({
                    type: 'other',
                    match: lexerIter.current.match[0]
                });
            }
        }

        function addToken(token) {
            output.push(token);
        }
    }

    function concatOtherTokens(tokens) {
        var i, otherMatches, token, result = [];
        for (i = 0; i < tokens.length; i++) {
            token = tokens[i];
            if (token.type === 'other') {
                if (!otherMatches) {
                    otherMatches = [];
                }
                otherMatches.push(token.match);
            } else {
                flushOtherTokensIfNeeded();
                result.push(token);
            }
        }
        flushOtherTokensIfNeeded();
        return result;

        function flushOtherTokensIfNeeded() {
            if (otherMatches) {
                result.push({
                    type: 'other',
                    match: otherMatches.join('')
                });
                otherMatches = null;
            }
        }
    }


    function compileLexer(lexemeSpecs, ignoreCase) {
        var re = buildRegex(ignoreCase, lexemeSpecs);
        return function(input) {
            return lex(input, re, lexemeSpecs);
        };

        function buildRegex() {
            var re = [],
                i;
            for (i = 0; i < lexemeSpecs.length; i++) {
                re.push(lexemeSpecs[i].re);
            }
            return new RegExp('(' + re.join(')|(') + ')', ignoreCase ? 'gmi' : 'gm');
        }
    }

    function lex(input, re, lexemeSpecs) {
        var match,
        result = [],
            lastMatchEnd = 0;
        while (match = re.exec(input)) {
            addOtherlexemeIfNeeded(match.index);
            result.push(createlexeme(match));
            lastMatchEnd = match.index + match[0].length;
        }
        addOtherlexemeIfNeeded(input.length);

        return result;

        function addOtherlexemeIfNeeded(nextMatchStart) {
            if (nextMatchStart > lastMatchEnd) {
                result.push({
                    type: 'other',
                    match: [input.substring(lastMatchEnd, nextMatchStart)]
                });
            }
        }

        function createlexeme(match) {
            var i, groupIndex = 1,
                lexerSpec;
            for (i = 0; i < lexemeSpecs.length; i++) {
                lexerSpec = lexemeSpecs[i];
                if (match[groupIndex]) {
                    return {
                        type: lexerSpec.type,
                        match: match.slice(groupIndex, groupIndex + lexerSpec.groupCount + 1)
                    };
                }
                groupIndex += lexerSpec.groupCount + 1;
            }
            throw new Error("Internal error: could not find a matching lexerSpec for match " + match);
        }
    }

    function iterator(array) {
        var index = -1,
            result = {
                next: next,
                prev: prev
            };
        return result;

        function updateCurrent() {
            return result.current = array[index];
        }

        function next() {
            index++;
            return updateCurrent();
        }

        function prev() {
            index--;
            return updateCurrent();
        }
    }
});