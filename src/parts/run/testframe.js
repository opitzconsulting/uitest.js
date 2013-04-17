uitest.define('run/testframe', ['urlParser', 'global', 'top', 'run/config', 'run/injector', 'run/logger', 'documentUtils', 'run/sniffer'], function(urlParser, global, top, runConfig, injector, logger, docUtils, sniffer) {
    var WINDOW_ID = 'uitestwindow',
        BUTTON_ID = WINDOW_ID+'Btn',
        BUTTON_LISTENER_ID = BUTTON_ID+"Listener",
        frameElement,
        callbacks = {},
        nextCallbackId = 0;

    top.uitest = global.uitest;

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
            createFrame(url, top);
            deactivateWindow(getIframeWindow());
            frameElement.onload = function() {
                frameElement.onload = null;
                rewriteDocument(getIframeWindow(), html);
            };
        }
    }

    function createFrame(url, topWindow) {
        var doc = topWindow.document,
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

        createToggleButtonIfNeeded(topWindow);

        return frameElement;
    }

    function createToggleButtonIfNeeded(topWindow) {
        var doc = topWindow.document,
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

    function loadUsingHistoryApi(url, html) {
        var fr, win;
        if (sniffer.browser.ff) {
            // In FF, we can't just juse an empty iframe and rewrite
            // it's content, as then the history api will throw errors
            // whenever history.pushState is used within the frame...
            fr = createFrame(urlParser.uitestUrl(), top);
            fr.onload = function() {
                fr.onload = null;
                // now the frame is in a safe state and we can continue...
                afterFrameCreate();
            };
        } else {
            createFrame('', top);
            win = getIframeWindow();
            // open/close assigns the url of the parent frame
            // to the iframe.
            // This is needed as we can't use js urls
            // for frames with about:blank.            
            win.document.open();
            win.document.close();

            afterFrameCreate();
        }

        function afterFrameCreate() {
            var win = getIframeWindow();
            win.history.pushState(null, '', url);
            rewriteDocument(win, html);
        }
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

    function rewriteDocument(win, html) {
        if (sniffer.jsUrl) {
            rewriteWithJsUrl();
        } else {
            rewriteWithoutJsUrl();
        }

        function rewriteWithJsUrl() {
            var currHash = win.location.hash;
            // Bugs here:
            // - IE looses the hash when rewriting using a js url
            // - Rewriting using a js url or doc.open/write/close deletes the current history entry.
            //   This yields to problems when using history.back()!
            //   (at least in a fresh Chrome in Inkognito mode)
            // - PhantomJS: creating a history entry using hash change does not work correctly.
            //   Using history.pushState however does work...
            html = html.replace(/<head[^>]*>/i, function(match) {
                var createHistoryEntryCommand;
                if (win.history.pushState) {
                    createHistoryEntryCommand = 'history.pushState(null, "", "'+currHash+'");';
                } else {
                    createHistoryEntryCommand = 'location.hash="someUniqueHashToCreateAHistoryEntry";location.hash="'+currHash+'";';
                }
                return match+'<script type="text/javascript">'+createHistoryEntryCommand+'</script>';
            });
            win.newContent = html;
            /*jshint scripturl:true*/
            win.location.href = 'javascript:window.newContent';
        }

        function rewriteWithoutJsUrl() {
            // Rewrite using js url does not work, use document.open/write/close
            // Right now, we only need this for FF, as it does not open javascript urls
            // with the same url as the previous document.
            if (win.location.href==='about:blank' || win.location.href==='') {
                dump("now");
                rewrite(win, html);
                return;
            }
            // If the iframe already has a valid url,
            // wo don't want to change it by this rewrite.
            // By using an inline script this does what we want.
            // Calling win.document.open() directly would give the iframe
            // the url of the current window, i.e. a new url.
            // Note: This does not work for xhtml, as xhtml documents
            // do not allow document.open/write/close.
            win.newContent = html;
            var sn = win.document.createElement("script");
            sn.setAttribute("id", "rewriteScript");
            sn.setAttribute("type", "text/javascript");
            docUtils.textContent(sn, rewrite.toString()+';rewrite(window, window.newContent);');

            win.document.body.appendChild(sn);
        }

        function rewrite(win, newContent) {
            /*jshint evil:true*/
            win.document.open();
            win.document.write(newContent);
            win.document.close();
        }
    }


    function createRemoteCallExpression(callback) {
        var argExpressions = global.Array.prototype.slice.call(arguments, 1) || [],
            callbackId = nextCallbackId++;
        callbacks[callbackId] = callback;
        return "parent.uitest.callbacks[" + callbackId + "](" + argExpressions.join(",") + ");";
    }
});
