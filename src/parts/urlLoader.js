uitest.define('urlLoader', ['urlParser', 'global'], function(urlParser, global) {

    var REFRESH_URL_ATTRIBUTE = 'uitr',
        WINDOW_ID = 'uitestwindow',
        frameElement,
        frameWindow,
        popupWindow,
        openCounter = 0;

    function navigateWithReloadTo(win, url) {
        var parsedUrl = urlParser.parseUrl(url);
        urlParser.setOrReplaceQueryAttr(parsedUrl, REFRESH_URL_ATTRIBUTE, openCounter++);
        win.location.href = urlParser.serializeUrl(parsedUrl);
    }

    function open(config) {
        var remoteWindow;
        if (config.loadMode === 'popup') {
            if (!popupWindow) {
                popupWindow = global.open('', WINDOW_ID);
            }
            remoteWindow = popupWindow;
        } else if (config.loadMode === 'iframe') {
            if (!frameWindow) {
                frameElement = global.document.createElement("iframe");
                frameElement.name = WINDOW_ID;
                frameElement.setAttribute("width", "100%");
                frameElement.setAttribute("height", "100%");
                var winSize = {
                    width: window.innerWidth,
                    height: window.innerHeight
                };
                frameElement.setAttribute("style", "position: absolute; z-index: 10; bottom: 0; left: 0; pointer-events:none;");
                var body = global.document.body;
                body.appendChild(frameElement);
                frameWindow = frameElement.contentWindow || frameElement.contentDocument;
            }
            remoteWindow = frameWindow;
        }
        navigateWithReloadTo(remoteWindow, config.url);
        return remoteWindow;
    }

    function close() {
        if (frameElement) {
            frameElement.parentElement.removeChild(frameElement);
            frameElement = null;
            frameWindow = null;
        }
        if (popupWindow) {
            popupWindow.close();
            popupWindow = null;
        }
    }

    return {
        open: open,
        navigateWithReloadTo: navigateWithReloadTo,
        close: close
    };
});
