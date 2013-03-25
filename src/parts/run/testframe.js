uitest.define('run/testframe', ['urlParser', 'global', 'run/config', 'run/injector', 'run/logger', 'documentUtils', 'run/sniffer'], function(urlParser, global, runConfig, injector, logger, docUtils, sniffer) {
    var WINDOW_ID = 'uitestwindow',
        frameElement,
        exports;

    global.top.uitest = global.uitest;
    frameElement = findIframe(global.top);
    if (!frameElement) {
        frameElement = createIframe(global.top);
        createToggleButton(global.top, frameElement);
    }
    navigateWithReloadTo(getIframeWindow(), runConfig.url);

    injector.addDefaultResolver(function(argName) {
        return exports.win()[argName];
    });

    return exports = {
        win: getIframeWindow,
        rewriteDocument: rewriteDocument
    };

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

    function getIframeWindow() {
        return frameElement.contentWindow || frameElement.contentDocument;
    }

    function navigateWithReloadTo(win, url) {
        var now = new global.Date().getTime();
        url = makeAbsolute(url);
        url = urlParser.cacheBustingUrl(url, now);
        url = url.replace("{now}",now);
        logger.log("opening url "+url);
        win.location.href = url;
    }

    function makeAbsolute(url) {
        return urlParser.makeAbsoluteUrl(url, urlParser.uitestUrl());
    }

    function rewriteDocument(html) {
        var win = exports.win();
        if (sniffer.jsUrl) {
            rewriteWithJsUrl();
        } else {
            rewriteWithoutJsUrl();
        }

        function rewriteWithJsUrl() {
            var currHash = win.location.hash;
            if (currHash) {
                // preserve the hash. Needed for ie!
                html = html.replace(/<head[^>]*>/i, function(match) {
                    return match+'<script type="text/javascript">location.hash="'+currHash+'";</script>';
                });
            }
            global.top.newContent = html;
            /*jshint scripturl:true*/
            win.location.href = 'javascript:window.top.newContent';
        }

        function rewriteWithoutJsUrl() {
            // We replace the content using an inline script, 
            // so that the window keeps it's original url although we replace it's content!
            // Right now, we only need this for FF, as it does not open javascript urls
            // with the same url as the previous document.
            // Note: This does not work for xhtml, as xhtml documents
            // do not allow document.open/write/close.
            // To support xhtml on FF, another idea would be to create a new
            // iframe and modify it's location using history.pushState,
            // so that relative scripts, ... of the new content are loaded correctly.
            // However, FF throws an exception if history.pushState is used on 
            // a new frame that was filled using document.open/write/close :-(            
            win.newContent = html;
            var sn = win.document.createElement("script");
            sn.setAttribute("id", "rewriteScript");
            sn.setAttribute("type", "text/javascript");
            docUtils.textContent(sn, rewrite.toString()+';rewrite();');

            win.document.body.appendChild(sn);
        }

        function rewrite() {
            /*jshint evil:true*/
            var newContent = window.newContent;
            document.open();
            document.write(newContent);
            document.close();
        }
    }
});
