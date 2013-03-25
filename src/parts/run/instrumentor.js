uitest.define('run/instrumentor', ['documentUtils', 'run/config', 'run/logger', 'global', 'run/testframe', 'run/sniffer'], function(docUtils, runConfig, logger, global, testframe, sniffer) {

    var exports,
        NO_SCRIPT_TAG = "noscript",
        preprocessors = [],
        COMPARE_BY_PRIO = function(entry1, entry2) {
            return entry2.prio - entry1.prio;
        };

    function addPreprocessor(priority, preprocessor) {
        preprocessors.push({prio: priority, processor: preprocessor});
    }
    instrument.callbacks = [];

    function instrument(win) {
        preprocessors.sort(COMPARE_BY_PRIO);
        logger.log("starting instrumentation");
        exports.internal.deactivateAndCaptureHtml(win, function(html) {
            var i;
            logger.log("captured html");

            for (i=0; i<preprocessors.length; i++) {
                html = preprocessors[i].processor(html);
            }

            // We need to unpack empty tags to open/close tags here, 
            // as the new document is always a normal html document. E.g. empty script tags
            // (<script.../>) would result in the next script tag to not be executed!
            html = docUtils.makeEmptyTagsToOpenCloseTags(html);
            testframe.rewriteDocument(html);
        });
    }

    function deactivateAndCaptureHtml(win, callback) {
        if (sniffer.browser.ie && sniffer.browser.ie<=8) {
            oldIEDeactivateAndCaptureHtml(win, callback);
        } else {
            defaultDeactivateAndCaptureHtml(win, callback);
        }
    }

    function defaultDeactivateAndCaptureHtml(win, callback) {
        var doc = win.document;
        removeCurrentScript(doc);

        // We replace the documentElement into which the web browser
        // currently adds all data from the server.
        // In most browsers this will prevent any script on the page
        // to get executed.

        // However, in some browsers, the scripts are still executed
        // and we need to prevent them from chaning the dom and throwing errors
        // (e.g. Android 2.3 browser and IE<10).

        // No need to care for:
        // - changing globals: We rewrite the document later which will 
        //   revert all globals (see testframe).
        // - modification of the DOM using document.*: document.* access our always new document.

        var oldDocEl = doc.documentElement;
        var newDocEl = oldDocEl.cloneNode(false);
        newDocEl.appendChild(doc.createElement("head"));
        newDocEl.appendChild(doc.createElement("body"));

        doc.removeChild(oldDocEl);
        doc.appendChild(newDocEl);
        var restore = preventErrorsByNooping(win);

        docUtils.addEventListener(win, 'load', finished);

        function finished() {
            restore();

            var docType = docUtils.serializeDocType(win.document);
            var htmlOpenTag = docUtils.serializeHtmlTag(oldDocEl);
            var innerHtml = oldDocEl.innerHTML;
            innerHtml = innerHtml.replace("parent.uitest.instrument(window)", "false");
            var html = docType+htmlOpenTag+innerHtml+"</html>";
            callback(html);
        }
    }

    // For old IE<=8 only!
    function oldIEDeactivateAndCaptureHtml(win, callback) {
        var doc = win.document;
        removeCurrentScript(doc);
        var prefix = doc.documentElement.innerHTML;
        var deactivateComment = "<![if false]>";
        doc.write(deactivateComment);

        docUtils.addEventListener(win, 'load', finished);

        function finished() {
            var innerHtml = doc.documentElement.innerHTML;
            innerHtml = innerHtml.replace(deactivateComment, "");
            var endHtmlMatch = innerHtml.match(/([\s\S]*)<\/html>/i);
            if (endHtmlMatch) {
                innerHtml = endHtmlMatch[1];
            }
            var docType = docUtils.serializeDocType(win.document);
            var htmlOpenTag = docUtils.serializeHtmlTag(win.document.documentElement);

            var html = docType+htmlOpenTag+innerHtml+"</html>";
            callback(html);
        }
    }

    function preventErrorsByNooping(win) {
        var doc = win.document,
            restoreFns = [];

        replaceWinFn("setTimeout", noop);
        replaceWinFn("setInterval", noop);
        replaceWinFn("XMLHttpRequest", FakeXMLHttpRequest);

        replaceDocFn("write", noop);
        replaceDocFn("writeln", noop);

        return function() {
            var i;
            for (i=0; i<restoreFns.length; i++) {
                restoreFns[i]();
            }
        };

        function replaceWinFn(name, replaceFn) {
            var _old = win[name];
            win[name] = replaceFn;
            restoreFns.push(restore);

            function restore() {
                win[name] = _old;
            }
        }
        function replaceDocFn(name, replaceFn) {
            var _old = doc[name];
            doc[name] = replaceFn;
            restoreFns.push(restore);

            function restore() {
                doc[name] = _old;
            }
        }

        function noop() {
        }

        function FakeXMLHttpRequest() {
            this.open = noop;
            this.send = noop;
            this.cancel = noop;
            this.setRequestAttribute = noop;
        }
    }

    function removeCurrentScript(doc) {
        var scripts = doc.getElementsByTagName("script");
        var lastScript = scripts[scripts.length-1];
        lastScript.parentNode.removeChild(lastScript);
    }

    function createRemoteCallExpression(callback) {
        var argExpressions = global.Array.prototype.slice.call(arguments, 1) || [],
            callbackId = instrument.callbacks.length;
        instrument.callbacks.push(callback);
        return "parent.uitest.instrument.callbacks[" + callbackId + "](" + argExpressions.join(",") + ");";
    }

    exports = {
        internal: {
            instrument: instrument,
            deactivateAndCaptureHtml: deactivateAndCaptureHtml
        },
        createRemoteCallExpression: createRemoteCallExpression,
        addPreprocessor: addPreprocessor,
        global: {
            uitest: {
                instrument: instrument
            }
        }
    };
    return exports;
});