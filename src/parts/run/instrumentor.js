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
        exports.internal.deactivateAndCaptureHtml(win, function(html, browserFlags) {
            var i;
            logger.log("captured html");
            
            for (i=0; i<preprocessors.length; i++) {
                html = preprocessors[i].processor(html, browserFlags);
            }

            exports.internal.rewriteDocument(win, html);
        });
    }

    function deactivateAndCaptureHtml(win, callback) {
        // This will wrap the rest of the document into a noscript tag.
        // By this, that content will not be executed!
        var htmlPrefix = docUtils.serializeHtmlBeforeLastScript(win.document);
        win.document.write('<!--[if lt IE 10]>' + docUtils.contentScriptHtml('window.ieLt10=true;') + '<![endif]-->');
        win.document.write('</head><body><' + NO_SCRIPT_TAG + '>');
        win.addEventListener('load', function() {
            var noscriptEl = win.document.getElementsByTagName(NO_SCRIPT_TAG)[0];
            var noscriptElContent = noscriptEl.textContent;
            var browserFlags = {
                ieLt10: !! win.ieLt10
            };
            if(noscriptElContent) {
                callback(htmlPrefix + noscriptElContent, browserFlags);
            } else {
                logger.log("couldn't retrive the document html using the noscript hack, doing another xhr request...");
                // Android 2.3 browsers don't wrap the rest of the document
                // into the noscript tag, but leave it empty :-(
                // At least it stops the document from loading...
                docUtils.loadFile(win, win.document.location.href, true, function(error, data) {
                    if(error) {
                        throw error;
                    }
                    data = data.replace("parent.uitest.instrument(window)", "");
                    callback(data, browserFlags);
                });
            }
        }, false);
    }

    function rewriteDocument(win, html) {
        win.newContent = html;
        // This trick is needed for IE10 and IE9
        // so that the window keeps it's original url although we replace it's content!
        // (setTimeout only needed for IE9!)
        var sn = win.document.createElement("script");
        sn.setAttribute("type", "text/javascript");
        sn.textContent = 'function rewrite() { document.open();document.write(newContent);document.close();} window.setTimeout(rewrite,0);';
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