uitest.define('run/instrumentor', ['documentUtils', 'run/config', 'run/logger', 'global'], function(docUtils, runConfig, logger, global) {

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

            exports.internal.rewriteDocument(win, html);
        });
    }

    function deactivateAndCaptureHtml(win, callback) {
        var doc = win.document;
        removeCurrentScript(doc);

        // We replace the documentElement into which the web browser
        // currently adds all data from the server.
        // In most browsers this will prevent any script on the page
        // to get executed.

        // However, in some browsers, the scripts are still executed
        // and we need to prevent them from chaing the DOM
        // (e.g. Android 2.3 browser and IE<10).

        // No need to care for:
        // - modification of the DOM using document.*: document.* access our always new document.
        // - catch all event listeners, e.g. for DOMContentLoaded, win.load, ...:
        //   we are doing a document.open() afterwards, which will unregister those listeners.

        var oldDocEl = doc.documentElement;
        var newDocEl = oldDocEl.cloneNode(false);
        newDocEl.appendChild(doc.createElement("head"));
        newDocEl.appendChild(doc.createElement("body"));

        doc.removeChild(oldDocEl);
        doc.appendChild(newDocEl);
        var restore = saveAndFreezeDoc(win);

        docUtils.addEventListener(win, 'load', function() {
            restore();

            var docType = docUtils.serializeDocType(win.document);
            var htmlOpenTag = docUtils.serializeHtmlTag(oldDocEl);
            var innerHtml = oldDocEl.innerHTML;
            innerHtml = innerHtml.replace("parent.uitest.instrument(window)", "false");
            callback(docType+htmlOpenTag+innerHtml+"</html>");
        });
    }

    function saveAndFreezeDoc(win) {
        var doc = win.document,
            restoreFns = [];

        saveGlobals();
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

        function saveGlobals() {
            var prop,
                oldGlobals = {};

            for (prop in win) {
                oldGlobals[prop] = win[prop];
            }

            restoreFns.push(restore);

            function restore() {
                var prop;
                for (prop in win) {
                    if (!(prop in oldGlobals)) {
                        // Note: if the variable was defined using "var",
                        // deleting it from the window object does not
                        // really delete it. For this, we also always set it
                        // to undefined!
                        win[prop] = undefined;
                        try {
                            delete win[prop];
                        } catch (e) {
                            // IE doe not allow to delete variables from window...
                        }
                    }
                }
            }
        }

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

    function rewriteDocument(win, html) {
        win.newContent = html;
        // This trick is needed for IE10 and IE9
        // so that the window keeps it's original url although we replace it's content!
        // (setTimeout only needed for IE9!)
        var sn = win.document.createElement("script");
        sn.setAttribute("type", "text/javascript");
        docUtils.textContent(sn, 'function rewrite() { var newContent = window.newContent; document.open();document.write(newContent);document.close();} window.setTimeout(rewrite,0);');
        win.document.body.appendChild(sn);
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
            deactivateAndCaptureHtml: deactivateAndCaptureHtml,
            rewriteDocument: rewriteDocument
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