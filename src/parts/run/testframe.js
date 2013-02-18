uitest.define('run/testframe', ['urlParser', 'global', 'run/config', 'run/injector', 'run/logger', 'documentUtils'], function(urlParser, global, runConfig, injector, logger, docUtils) {
    var WINDOW_ID = 'uitestwindow',
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
        docUtils.setStyle(frameElement, "position: absolute; top: 0; left: 0; background-color:white; border: 0px");
        frameElement.style.zIndex = 100;
        doc.body.appendChild(frameElement);

        return frameElement;
    }

    function createToggleButton(topWindow, iframeElement) {
        var doc = topWindow.document,
            toggleButton = doc.createElement("button");
        docUtils.textContent(toggleButton, "Toggle testframe");
        docUtils.setStyle(toggleButton, "position: absolute; z-index: 1000; width: auto; top: 0; right: 0; cursor: pointer;");
        docUtils.addEventListener(toggleButton, "click", toggleListener);
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
        url = makeAbsolute(url);
        url = urlParser.cacheBustingUrl(url, global.Date.now());
        logger.log("opening url "+url);
        win.location.href = url;
    }

    function makeAbsolute(url) {
        return urlParser.makeAbsoluteUrl(url, urlParser.uitestUrl());
    }
});
