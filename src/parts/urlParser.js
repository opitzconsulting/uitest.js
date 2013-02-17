uitest.define('urlParser', ['global'], function (global) {
    var UI_TEST_RE = /(uitest|simpleRequire)[^\w\/][^\/]*$/;


    function parseUrl(url) {
        var hashIndex = url.indexOf('#');
        var hash;
        var query = '';
        if (hashIndex !== -1) {
            hash = url.substring(hashIndex + 1);
            url = url.substring(0, hashIndex);
        }
        var queryIndex = url.indexOf('?');
        if (queryIndex !== -1) {
            query = url.substring(queryIndex + 1);
            url = url.substring(0, queryIndex);
        }
        return {
            baseUrl:url,
            hash:hash,
            query:query ? query.split('&') : []
        };
    }

    function serializeUrl(parsedUrl) {
        var res = parsedUrl.baseUrl;
        if (parsedUrl.query && parsedUrl.query.length) {
            res += '?' + parsedUrl.query.join('&');
        }
        if (parsedUrl.hash) {
            res += '#' + parsedUrl.hash;
        }
        return res;
    }

    function setOrReplaceQueryAttr(parsedUrl, attr, value) {
        var newQueryEntry = attr + '=' + value;
        var query = parsedUrl.query;
        for (var i = 0; i < query.length; i++) {
            if (query[i].indexOf(attr) === 0) {
                query[i] = newQueryEntry;
                return;
            }
        }
        query.push(newQueryEntry);
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
        if(url.charAt(0) === '/' || url.indexOf('://') !== -1) {
            return url;
        }
        return basePath(baseUrl) + '/' + url;
    }

    function filenameFor(url) {
        var lastSlash = url.lastIndexOf('/');
        var urlWithoutSlash = url;
        if(lastSlash !== -1) {
            urlWithoutSlash = url.substring(lastSlash + 1);
        }
        var query = urlWithoutSlash.indexOf('?');
        if (query !== -1) {
            return urlWithoutSlash.substring(0, query);
        }
        return urlWithoutSlash;
    }

    return {
        setOrReplaceQueryAttr:setOrReplaceQueryAttr,
        parseUrl:parseUrl,
        serializeUrl:serializeUrl,
        makeAbsoluteUrl: makeAbsoluteUrl,
        filenameFor: filenameFor,
        uitestUrl: uitestUrl
    };
});