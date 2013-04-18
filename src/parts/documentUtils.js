uitest.define('documentUtils', ['global', 'urlParser'], function(global, urlParser) {
    var jsonpResultCallbacks = [];
    global.uitest.jsonpResultCallbacks = jsonpResultCallbacks;
    return {
        loadFile: loadFile,
        evalScript: evalScript,
        loadScript: loadScript,
        addEventListener: addEventListener,
        removeEventListener: removeEventListener,
        textContent: textContent
    };

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
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                if (xhr.status === 200 || xhr.status === 0) {
                    resultCallback(null, xhr.responseText);
                } else {
                    resultCallback(new Error("Error loading url " + url + ":" + xhr.statusText));
                }
            }
        };
        xhr.send();
    }

    function createCORSRequest(method, url) {
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
            xhr = null;
        }
        return xhr;
    }

    function loadScript(url, resultCallback) {
        loadFile(url, function(error, data) {
            if (!error) {
                resultCallback(null, data + "//@ sourceURL=" + url);
            } else {
                resultCallback(error, data);
            }
        });
    }

    function evalScript(win, scriptContent) { /*jshint evil:true*/
        win["eval"].call(win, scriptContent);
    }

    function addEventListener(target, type, callback) {
        if (target.nodeName && target.nodeName.toLowerCase() === 'iframe' && type === 'load') {
            // Cross browser way for onload iframe handler
            if (target.attachEvent) {
                target.attachEvent('onload', callback);
            } else {
                target.onload = callback;
            }
        } else if (target.addEventListener) {
            target.addEventListener(type, callback, false);
        } else {
            target.attachEvent("on" + type, callback);
        }
    }

    function removeEventListener(target, type, callback) {
        if (target[type] === callback) {
            target[type] = null;
        }
        if (target.removeEventListener) {
            target.removeEventListener(type, callback, false);
        } else {
            target.detachEvent("on" + type, callback);
        }
    }

    function textContent(el, val) {
        if ("text" in el) {
            el.text = val;
        } else {
            if ("innerText" in el) {
                el.innerHTML = val;
            } else {
                el.textContent = val;
            }
        }
    }

});