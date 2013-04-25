uitest.define('urlParser', ['global'], function (global) {
    var URL_RE = /(((\w+)\:)?\/\/([^\/]+))?([^\?#]*)(\?([^#]*))?(#.*)?/,
        UI_TEST_RE = /(uitest)[^\w\/][^\/]*$/,
        NUMBER_RE = /^\d+$/;

    return {
        parseUrl:parseUrl,
        serializeUrl:serializeUrl,
        isAbsoluteUrl: isAbsoluteUrl,
        makeAbsoluteUrl: makeAbsoluteUrl,
        filenameFor: filenameFor,
        uitestUrl: uitestUrl,
        cacheBustingUrl: cacheBustingUrl
    };

    function parseUrl(url) {
        var match = url.match(URL_RE);
        return {
            protocol: match[3] || '',
            domain: match[4] || '',
            path: match[5] || '',
            query: match[7] ? match[7].split('&'):[],
            hash: match[8]?match[8].substring(1):undefined
        };
    }

    function serializeUrl(parsedUrl) {
        var res = [];
        if (parsedUrl.protocol) {
            res.push(parsedUrl.protocol);
            res.push(":");
        }
        if (parsedUrl.domain) {
            res.push("//");
            res.push(parsedUrl.domain);
        }
        if (parsedUrl.path) {
            res.push(parsedUrl.path);
        }
        if (parsedUrl.query && parsedUrl.query.length) {
            res.push('?');
            res.push(parsedUrl.query.join('&'));
        }
        if (typeof parsedUrl.hash === "string") {
            res.push('#');
            res.push(parsedUrl.hash);
        }
        return res.join('');
    }

    function uitestUrl() {
        var scriptNodes = global.document.getElementsByTagName("script"),
            i, src;
        for(i = 0; i < scriptNodes.length; i++) {
            src = scriptNodes[i].src;
            if(src && src.match(UI_TEST_RE)) {
                return src;
            }
        }
        throw new Error("Could not locate uitest.js in the script tags of the browser");
    }

    function basePath(url) {
        var lastSlash = url.lastIndexOf('/');
        if(lastSlash === -1) {
            return '';
        }
        return url.substring(0, lastSlash);
    }

    function makeAbsoluteUrl(url, baseUrl) {
        if(isAbsoluteUrl(url)) {
            return url;
        }
        var parsedBase = parseUrl(baseUrl);
        var parsedUrl = parseUrl(url);
        parsedUrl.protocol = parsedBase.protocol;
        parsedUrl.domain = parsedBase.domain;
        parsedUrl.path = basePath(parsedBase.path) + '/' + parsedUrl.path;
        return serializeUrl(parsedUrl);
    }

    function isAbsoluteUrl(url) {
        return url.charAt(0) === '/' || url.indexOf('://') !== -1;
    }

    function filenameFor(url) {
        var parsedUrl = parseUrl(url),
            path = parsedUrl.path;
        var lastSlash = path.lastIndexOf('/');
        if(lastSlash !== -1) {
            return path.substring(lastSlash + 1);
        }
        return path;
    }

    function cacheBustingUrl(url, timestamp) {
        var parsedUrl = parseUrl(url),
            query = parsedUrl.query,
            i, foundOldEntry = false;
        for (i = 0; i < query.length && !foundOldEntry; i++) {
            if (query[i].match(NUMBER_RE)) {
                query[i] = timestamp;
                foundOldEntry = true;
            }
        }
        if (!foundOldEntry) {
            query.push(timestamp);
        }
        return serializeUrl(parsedUrl);
    }
});