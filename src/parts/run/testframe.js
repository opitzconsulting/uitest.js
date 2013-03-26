uitest.define('run/testframe', ['urlParser', 'global', 'top', 'run/config', 'run/injector', 'run/logger', 'documentUtils', 'run/sniffer'], function(urlParser, global, top, runConfig, injector, logger, docUtils, sniffer) {
    var WINDOW_ID = 'uitestwindow',
        BUTTON_ID = WINDOW_ID+'Btn',
        BUTTON_LISTENER_ID = BUTTON_ID+"Listener",
        frameElement,
        toggleButton,
        exports;

    top.uitest = global.uitest;
    frameElement = createFrame(top);
    toggleButton = createToggleButton(top, frameElement);

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

    function createFrame(topWindow) {
        var doc = topWindow.document,
            frameElement = doc.getElementById(WINDOW_ID);

        if (frameElement) {
            // resuse an old iframe, if existing...
            return frameElement;
        }
        var wrapper = doc.createElement("div");
        wrapper.innerHTML = '<iframe id="'+WINDOW_ID+'" '+
                            'width="100%" height="100%" '+
                            'style="position: absolute; top: 0; left: 0; background-color:white; border: 0px;"></iframe>';

        frameElement = wrapper.firstChild;
        frameElement.style.zIndex = 100;
        doc.body.appendChild(frameElement);

        return frameElement;
    }

    function createToggleButton(topWindow, iframeElement) {
        var doc = topWindow.document,
            button = doc.getElementById(BUTTON_ID);

        if (button) {
            // resuse an existing button, if existing...
            return button;
        }
        var wrapper = doc.createElement("div");
        wrapper.innerHTML = '<button id="'+BUTTON_ID+'" '+
            'style="position: absolute; z-index: 1000; width: auto; top: 0; right: 0; cursor: pointer;" '+
            'onclick="('+toggleListener.toString()+')(\''+WINDOW_ID+'\');"'+
            '>Toggle testframe</button>';
        button = wrapper.firstChild;
        doc.body.appendChild(button);

        return button;

        function toggleListener(frameId) {
            var el = document.getElementById(frameId);
            el.style.zIndex = el.style.zIndex * -1;
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
            win.parent.newContent = html;
            /*jshint scripturl:true*/
            win.location.href = 'javascript:window.parent.newContent';
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
