uitest.define('run/testframe', ['urlParser', 'global', 'run/config'], function(urlParser, global, runConfig) {
    var REFRESH_URL_ATTRIBUTE = 'uitr',
        WINDOW_ID = 'uitestwindow',
        REFRESH_COUNTER = WINDOW_ID+'RefreshCounter',
        frameElement, frameWindow;

    frameElement = findIframe(global.top);
    if (!frameElement) {
        frameElement = createIframe(global.top);
    }
    frameWindow = getIframeWindow(frameElement);
    navigateWithReloadTo(frameWindow, runConfig.url);

    return frameWindow;

    function findIframe(topWindow) {
        return topWindow.document.getElementById(WINDOW_ID);
    }

    function createIframe(topWindow) {
        var doc = topWindow.document,
            frameElement = doc.createElement("iframe");

        frameElement.name = WINDOW_ID;
        frameElement.setAttribute("id", WINDOW_ID);
        frameElement.setAttribute("width", "100%");
        frameElement.setAttribute("height", "100%");
        frameElement.setAttribute("style", "position: absolute; z-index: 100; bottom: 0; left: 0;");
        doc.body.appendChild(frameElement);
        return frameElement;
    }

    function getIframeWindow(frameElement) {
        return frameElement.contentWindow || frameElement.contentDocument;
    }

    function navigateWithReloadTo(win, url) {
        var parsedUrl = urlParser.parseUrl(url);
        var openCounter = global.top[REFRESH_COUNTER] || 0;
        openCounter++;
        global.top[REFRESH_COUNTER] = openCounter;

        urlParser.setOrReplaceQueryAttr(parsedUrl, REFRESH_URL_ATTRIBUTE, openCounter);
        win.location.href = urlParser.serializeUrl(parsedUrl);
    }
});
