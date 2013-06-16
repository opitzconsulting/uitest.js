uitest.define('jsParser', ['utils'], function (utils) {
    var TOKENS_MULTI_RE = [
        {
            type: "location",
            re: "([\\s,;]|^)location\\.((href|hash)\\s*=|replace|assign|reload)",
            callback: onLocationMatch,
            groupCount: 3
        },
        {
            type: "location",
            re: "[=|return]\\s*window\\.location([;,]|$)",
            callback: onLocationMatch,
            groupCount: 1
        },
        {
            type: "namedFunctionStart",
            re: "\\bfunction\\s*(\\w+)[^\\{]*\\{",
            callback: onNamedFunctionStartMatch,
            groupCount: 1
        }
    ];
    return transform;

    function transform(data, done) {
        var input = data.input,
            eventSource = data.eventSource,
            state = data.state,
            multiRe = utils.multiRegex(TOKENS_MULTI_RE, "gm");
        var result = data.input.replace(multiRe.regex, function () {
            var match = Array.prototype.slice.call(arguments),
                parsedMatch = multiRe.parseMatch(match),
                reSpec = parsedMatch.spec,
                localMatch = parsedMatch.match;
            var baseEvent = {
                type: 'js:' + reSpec.type,
                state: state
            };
            return reSpec.callback(eventSource, baseEvent, localMatch);
        });
        done(null, result);
    }

    function onLocationMatch(eventSource, baseEvent, match) {
        eventSource.emitSync(baseEvent);
        if (baseEvent.replace) {
            return match[0].replace("location", baseEvent.replace);
        }
        return match[0];
    }

    function onNamedFunctionStartMatch(eventSource, baseEvent, match) {
        baseEvent.name = match[1];
        eventSource.emitSync(baseEvent);
        if (baseEvent.append) {
            return match[0] + baseEvent.append;
        }
        return match[0];
    }
});
