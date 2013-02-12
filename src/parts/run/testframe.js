uitest.define('run/testframe', ['urlParser', 'global', 'run/config', 'run/injector', 'run/logger'], function(urlParser, global, runConfig, injector, logger) {
    var REFRESH_URL_ATTRIBUTE = 'uitr',
        WINDOW_ID = 'uitestwindow',
        REFRESH_COUNTER = WINDOW_ID+'RefreshCounter',
        frameElement, frameWindow;

    global.top.uitest = global.uitest;
    frameElement = findIframe(global.top);
    if (!frameElement) {
        frameElement = createIframe(global.top);
        createToggleButton(global.top, frameElement);
    }
    frameWindow = getIframeWindow(frameElement);
    navigateWithReloadTo(frameWindow, runConfig.url);

    injector.addDefaultResolver(frameWindow);
    return frameWindow;

    function findIframe(topWindow) {
        return topWindow.document.getElementById(WINDOW_ID);
    }

    function createIframe(topWindow) {
        var doc = topWindow.document,
            frameElement = doc.createElement("iframe");

        frameElement.setAttribute("id", WINDOW_ID);
        frameElement.setAttribute("width", "100%");
        frameElement.setAttribute("height", "100%");
        frameElement.setAttribute("style", "position: absolute; bottom: 0; left: 0;background-color:white");
        frameElement.style.zIndex = 100;
        doc.body.appendChild(frameElement);

        return frameElement;
    }

    function createToggleButton(topWindow, iframeElement) {
        var doc = topWindow.document,
            toggleButton = doc.createElement("button");
        toggleButton.textContent = "Toggle testframe";
        toggleButton.setAttribute("style", "position: absolute; z-index: 1000; top: 0; right: 0; cursor: pointer;");
        toggleButton.addEventListener("click", toggleListener, false);
        doc.body.appendChild(toggleButton);
        return toggleButton;

        function toggleListener() {
            frameElement.style.zIndex = frameElement.style.zIndex * -1;
        }
    }

    function getIframeWindow(frameElement) {
        return frameElement.contentWindow || frameElement.contentDocument;
    }

    function navigateWithReloadTo(win, url) {
        logger.log("opening url "+runConfig.url);
        var parsedUrl = urlParser.parseUrl(url);
        var openCounter = global.top[REFRESH_COUNTER] || 0;
        openCounter++;
        global.top[REFRESH_COUNTER] = openCounter;

        urlParser.setOrReplaceQueryAttr(parsedUrl, REFRESH_URL_ATTRIBUTE, openCounter);
        win.location.href = urlParser.serializeUrl(parsedUrl);
    }
});
