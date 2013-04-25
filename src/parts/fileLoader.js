uitest.define('fileLoader', ['global','sniffer','urlParser'], function(global, sniffer, urlParser) {
    return loadFile;

    // ---------
    function loadFile(url, resultCallback) {
        var xhr;
        if (!urlParser.isAbsoluteUrl(url)) {
            throw new Error("expected an absolute url!");
        }
        var parsedBaseUrl = urlParser.parseUrl(global.location.href),
            parsedLoadUrl = urlParser.parseUrl(url);
        if (parsedBaseUrl.domain && parsedLoadUrl.domain && parsedBaseUrl.domain !== parsedLoadUrl.domain) {
            parsedLoadUrl.path = '/' + parsedLoadUrl.domain + parsedLoadUrl.path;
            parsedLoadUrl.domain = "www.corsproxy.com";
            xhr = createCORSRequest('GET', urlParser.serializeUrl(parsedLoadUrl));
        } else {
            xhr = new global.XMLHttpRequest();
            xhr.open("GET", url, true);
        }
        if (typeof xhr.onload !== "undefined") {
            // For XDomainRequest...
            xhr.onload = onload;
            xhr.onerror = function(error) {
                resultCallback(new Error("Error loading url " + url + ":" + xhr.statusText));
            };
        } else {
            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    onload();
                }
            };
        }
        xhr.send();

        function onload() {
            // Note: for IE XDomainRequest xhr has no status,
            // and for file access xhr.status is always 0.
            if (xhr.status === 200 || !xhr.status) {
                resultCallback(null, xhr.responseText);
            } else {
                resultCallback(new Error("Error loading url " + url + ":" + xhr.statusText));
            }
        }
    }

    function createCORSRequest(method, url) {
        if (sniffer.corsXhrForceCacheBusting) {
            url = urlParser.cacheBustingUrl(url, new global.Date().getTime());
        }
        var xhr = new global.XMLHttpRequest();
        if ("withCredentials" in xhr) {
            // Check if the XMLHttpRequest object has a "withCredentials" property.
            // "withCredentials" only exists on XMLHTTPRequest2 objects.
            xhr.open(method, url, true);
        } else if (typeof global.XDomainRequest !== "undefined") {
            // Otherwise, check if XDomainRequest.
            // XDomainRequest only exists in IE, and is IE's way of making CORS requests.
            xhr = new global.XDomainRequest();
            xhr.open(method, url);
        } else {
            // Otherwise, CORS is not supported by the browser.
            throw new Error("No CORS support in this browser!");
        }
        return xhr;
    }
});