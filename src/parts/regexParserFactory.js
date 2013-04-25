uitest.define('regexParserFactory', ['utils'], function(utils) {

    return factory;

    function factory() {
        var types = [],
            typesByName = {};

        return {
            parse: parse,
            serialize: serialize,
            transform: transform,
            addTokenType: addTokenType,
            addSimpleTokenType: addSimpleTokenType,
            assertAllCharsInExactOneCapturingGroup: assertAllCharsInExactOneCapturingGroup
        };

        function addSimpleTokenType(name) {
            addTokenType(name, "(\\b" + name + "\\b)", name, {});
        }

        function addTokenType(name, reString, template, groupNames) {
            var templateMatch = new RegExp("^" + reString + "$", "i").exec(template);
            if (!templateMatch) {
                throw new Error("Template '" + template + "' does not match the regex '" + reString+"'");
            }
            assertAllCharsInExactOneCapturingGroup(reString);
            var groupCount = templateMatch.length-1;
            var type = {
                name: name,
                reString: reString,
                re: new RegExp(reString, "i"),
                groupNames: groupNames,
                groupCount: groupCount,
                template: template
            };
            types.push(type);
            typesByName[name] = type;
        }

        function parse(input) {
            var re = createRegex(),
                match,
                result = [],
                lastMatchEnd = 0;

            while (match = re.exec(input)) {
                addOtherTokenBetweenMatches();
                addMatch();
            }
            addTailOtherToken();
            return result;

            function createRegex() {
                var re = [],
                    i;
                for (i = 0; i < types.length; i++) {
                    if (re.length > 0) {
                        re.push("|(");
                    } else {
                        re.push("(");
                    }
                    re.push(types[i].reString, ")");
                }
                return new RegExp(re.join(""), "ig");
            }

            function addOtherTokenBetweenMatches() {
                if (match.index > lastMatchEnd) {
                    result.push({
                        type: 'other',
                        match: input.substring(lastMatchEnd, match.index)
                    });
                }
                lastMatchEnd = match.index + match[0].length;
            }

            function addMatch() {
                var i,
                groupIndex,
                type,
                parsedMatch = {
                    match: match[0]
                };
                lastMatchEnd = match.index + match[0].length;
                groupIndex = 1;
                for (i = 0; i < types.length; i++) {
                    if (match[groupIndex]) {
                        type = types[i];
                        break;
                    }
                    groupIndex += types[i].groupCount + 1;
                }
                if (!type) {
                    throw new Error("could not determine the type for match " + match);
                }
                parsedMatch.type = type.name;
                groupIndex++;
                for (i = 0; i < type.groupCount; i++) {
                    if (type.groupNames[i]) {
                        parsedMatch[type.groupNames[i]] = match[groupIndex];
                    }
                    groupIndex++;
                }
                result.push(parsedMatch);
            }

            function addTailOtherToken() {
                if (lastMatchEnd < input.length) {
                    result.push({
                        type: 'other',
                        match: input.substring(lastMatchEnd)
                    });
                }
            }
        }

        function serialize(parsed) {
            var i, token, result = [];
            for (i = 0; i < parsed.length; i++) {
                token = parsed[i];
                serializeToken(token);
            }
            return result.join('');

            function serializeToken(token) {
                if (token.type === 'other') {
                    result.push(token.match);
                    return;
                }
                var type = typesByName[token.type];
                var input = token.match || type.template;
                var match = type.re.exec(input);
                var i, groupName;
                for (i = 1; i < match.length; i++) {
                    groupName = type.groupNames[i-1];
                    if (groupName) {
                        result.push(token[groupName]);
                    } else {
                        result.push(match[i]);
                    }
                }
            }
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
                    pushTokenInsertPos = tokenIndex+1;
                eventSource.emit({
                    type: eventPrefix+token.type,
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
                    tokens.splice(pushTokenInsertPos++,0,token);
                }
            }
        }
    }

    function assertAllCharsInExactOneCapturingGroup(reString) {
        var groups = [], i, ch, nextEscaped, capturing, skipCheck;

        for (i = 0; i < reString.length; i++) {
            skipCheck = false;
            ch = reString.charAt(i);
            if (ch === '(' && !nextEscaped) {
                capturing = true;
                if (reString.charAt(i + 1) === '?') {
                    i+=2;
                    capturing = false;
                    skipCheck = true;
                }
                groups.push(capturing);
            } else if (ch === ')' && !nextEscaped) {
                groups.pop();
                if (reString.charAt(i+1)==='?') {
                    i++;
                }
                skipCheck = true;
            }
            if (!nextEscaped && ch==='\\') {
                nextEscaped = true;
            } else {
                nextEscaped = false;
            }
            if (capturingGroupCount()!==1 && !skipCheck) {
                throw new Error("Regex "+reString+" does not have exactly one capturing group at position "+i);
            }
        }

        function capturingGroupCount() {
            var count = 0, i;
            for (i=0; i<groups.length; i++) {
                if (groups[i]) {
                    count++;
                }
            }
            return count;
        }
    }
});