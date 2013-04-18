uitest.define('run/testframe', ['urlParser', 'global', 'run/config', 'run/injector', 'run/logger', 'documentUtils', 'run/sniffer'], function(urlParser, global, runConfig, injector, logger, docUtils, sniffer) {
    var WINDOW_ID = 'uitestwindow',
        BUTTON_ID = WINDOW_ID+'Btn',
        BUTTON_LISTENER_ID = BUTTON_ID+"Listener",
        frameElement,
        callbacks = {},
        nextCallbackId = 0;

    injector.addDefaultResolver(function(argName) {
        return getIframeWindow()[argName];
    });

    return {
        win: getIframeWindow,
        load: load,
        createRemoteCallExpression: createRemoteCallExpression
    };

    function getIframeWindow() {
        return frameElement.contentWindow || frameElement.contentDocument;
    }

    function load(url, html) {
        global.uitest.callbacks = callbacks;
        if (sniffer.history) {
            loadUsingHistoryApi(url, html);
        } else {
            loadWithoutHistoryApi(url, html);
        }
    }



    function loadUsingHistoryApi(url, html) {
        var fr, win;
        if (sniffer.browser.ff) {
            // In FF, we can't just juse an empty iframe and rewrite
            // it's content, as then the history api will throw errors
            // whenever history.pushState is used within the frame.
            // We need to do doc.open/write/close in the onload event
            // to prevent this problem!
            createFrame(urlParser.uitestUrl());
            win = getIframeWindow();
            docUtils.addEventListener(win, 'load', afterFrameCreate);
        } else {
            createFrame('');
            win = getIframeWindow();
            // Using doc.open/close empties the iframe, gives it a real url
            // and makes it different compared to about:blank!
            win.document.open();
            win.document.close();

            afterFrameCreate();
        }

        function afterFrameCreate() {
            var win = getIframeWindow();
            win.history.pushState(null, '', url);
            if (false && sniffer.jsUrl) {
                rewriteUsingJsUrl(win,html);
            } else {
                rewriteUsingDocOpen(win, html);
            }
        }
    }

    function loadWithoutHistoryApi(url, html) {
        createFrame(url);
        var win = getIframeWindow();
        docUtils.addEventListener(win, 'load', onload);
        deactivateWindow(win);

        function onload() {
            // Need to use javascript urls here to support xhtml,
            // as we loaded the document into the browser, and in xhtml
            // documents we can't open/write/close the document after this any more!
            rewriteUsingJsUrl(win, html);
        }
    }

    function createFrame(url) {
        var doc = global.document,
            wrapper;
        frameElement = doc.getElementById(WINDOW_ID);
        if (frameElement) {
            frameElement.parentNode.removeChild(frameElement);
            frameElement.src = url;
        } else {
            wrapper = doc.createElement("div");
            wrapper.innerHTML = '<iframe id="'+WINDOW_ID+'" '+
                                'src="'+url+'" '+
                                'width="100%" height="100%" '+
                                'style="position: absolute; top: 0; left: 0; background-color:white; border: 0px;"></iframe>';

            frameElement = wrapper.firstChild;
            frameElement.style.zIndex = 100;
        }
        doc.body.appendChild(frameElement);

        createToggleButtonIfNeeded();

        return frameElement;
    }

    function createToggleButtonIfNeeded() {
        var doc = global.document,
            button = doc.getElementById(BUTTON_ID);

        if (button) {
            // resuse an existing button...
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

    function rewriteUsingDocOpen(win, html) {
        // If the iframe already has a valid url,
        // wo don't want to change it by this rewrite.
        // By using an inline script this does what we want.
        // Calling win.document.open() directly would give the iframe
        // the url of the current window, i.e. a new url.
        win.newContent = html;
        var sn = win.document.createElement("script");
        sn.setAttribute("id", "rewriteScript");
        sn.setAttribute("type", "text/javascript");
        docUtils.textContent(sn, rewrite.toString()+';rewrite(window, window.newContent);');

        win.document.body.appendChild(sn);

        function rewrite(win, newContent) {
            /*jshint evil:true*/
            win.document.open();
            win.document.write(newContent);
            win.document.close();
        }
    }

    function rewriteUsingJsUrl(win, html) {
        win.newContent = html;
        /*jshint scripturl:true*/
        win.location.href = 'javascript:window.newContent';
    }

    function deactivateWindow(win) {
        win.setTimeout = noop;
        win.clearTimeout = noop;
        win.setInterval = noop;
        win.clearInterval = noop;
        win.XMLHttpRequest = noopXhr;
        if (win.attachEvent) {
            win.attachEvent = noop;
            win.Element.prototype.attachEvent = noop;
            win.HTMLDocument.prototype.attachEvent = noop;
        } else {
            win.addEventListener = noop;
            win.Element.prototype.addEventListener = noop;
            win.HTMLDocument.prototype.addEventListener = noop;
        }

        function noop() { }
        function noopXhr() {
            this.open=noop;
            this.send=noop;
            this.setRequestAttribute=noop;
            this.cancel=noop;
        }
    }

    function createRemoteCallExpression(callback) {
        var argExpressions = global.Array.prototype.slice.call(arguments, 1) || [],
            callbackId = nextCallbackId++;
        callbacks[callbackId] = callback;
        return "parent.uitest.callbacks[" + callbackId + "](" + argExpressions.join(",") + ");";
    }
});
