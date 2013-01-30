jasmineui.define('urlLoader', ['persistentData', 'urlParser', 'config', 'globals'], function (persistentData, urlParser, config, globals) {
    var refreshUrlAttribute = 'juir';

    function navigateWithReloadTo(win, url) {
        var data = persistentData();
        var parsedUrl = urlParser.parseUrl(url);
        var refreshCount = data.refreshCount = (data.refreshCount || 0) + 1;
        urlParser.setOrReplaceQueryAttr(parsedUrl, refreshUrlAttribute, refreshCount);
        persistentData.saveDataToWindow(win);
        win.location.href = urlParser.serializeUrl(parsedUrl);
    }

    var remoteWindow;
    var frameElement;
    var windowId = 'jasmineui-testwindow';

    function openTestWindow(url) {
        if (remoteWindow) {
            navigateWithReloadTo(remoteWindow, url);
            return remoteWindow;
        }
        if (config.loadMode === 'popup') {
            remoteWindow = globals.open(url, windowId);
        } else if (config.loadMode === 'iframe') {
            frameElement = globals.document.createElement("iframe");
            frameElement.name = windowId;
            frameElement.setAttribute("src", url);
            frameElement.setAttribute("style", "position: absolute; bottom: 0px; z-index:100; width: " + window.innerWidth + "px; height: " + window.innerHeight + "px");
            globals.document.body.appendChild(frameElement);
            remoteWindow = globals.frames[windowId];
        } else {
            throw new Error("Unknown load mode " + config.loadMode);
        }
        persistentData.saveDataToWindow(remoteWindow);
        return remoteWindow;
    }

    function closeTestWindow() {
        if (remoteWindow && config.closeTestWindow) {
            if (config.loadMode === 'popup') {
                remoteWindow.close();
            } else if (config.loadMode === 'iframe') {
                frameElement.parentElement.removeChild(frameElement);
            }
        }
        remoteWindow = null;
    }

    function checkAndNormalizeUrl(url) {
        var url = urlParser.makeAbsoluteUrl(config.baseUrl, url);
        var xhr = new globals.XMLHttpRequest();
        xhr.open("GET", url, false);
        xhr.send();
        if (xhr.status != 200) {
            throw new Error("Could not find url " + url);
        }
        return url;
    }

    return {
        navigateWithReloadTo: navigateWithReloadTo,
        openTestWindow: openTestWindow,
        closeTestWindow: closeTestWindow,
        checkAndNormalizeUrl: checkAndNormalizeUrl
    };
});