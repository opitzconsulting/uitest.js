uitest.define('run/requirejsInstrumentor', ['run/eventSource', 'run/injector', 'run/logger', 'utils', 'run/testframe', 'urlParser'], function(eventSource, injector, logger, utils, testframe, urlParser) {
    var REQUIRE_JS_RE = /require[\W]/,
        eventHandlers = [];

    // Needs to be before any other listener for 'addAppends',
    // as it stops the event if the page is using requirejs.
    addAppendsSuppressor.priority = 99999;
    eventSource.on('addAppends', addAppendsSuppressor);

    eventSource.on('html:simpleTag', checkAndHandleRequireJsScriptToken);

    return;

    function addAppendsSuppressor(event, done) {
        if (event.state && event.state.requirejs) {
            event.stop();
        }
        done();
    }

    function checkAndHandleRequireJsScriptToken(htmlEvent, htmlEventDone) {
        var token = htmlEvent.token,
            state = htmlEvent.state;

        if (token.name!=='script' || !token.attrs.src || !token.attrs.src.value.match(REQUIRE_JS_RE)) {
            htmlEventDone();
            return;
        }
        logger.log("detected requirejs with script url " + token.attrs.src.value);

        var content = testframe.createRemoteCallExpression(function(win) {
            afterRequireJsScript(win);
        }, "window");

        // Used by addAppendsSuppressor to see if
        // requirejs is used.
        state.requirejs = true;
        htmlEvent.pushToken({
            type: 'simpleTag',
            name: 'script',
            content: content,
            attrs:[]
        });
        htmlEventDone();
    }

    function afterRequireJsScript(win) {
        if (!win.require) {
            throw new Error("requirejs script was detected by url matching, but no global require function found!");
        }

        var _require = patchRequire(win);
        patchLoad(_require);
    }

    function patchRequire(win) {
        var _require = win.require;
        win.require = function(deps, originalCallback) {
            _require.onResourceLoad = win.require.onResourceLoad;
            _require(deps, function() {
                var depsValues = arguments;
                collectAndExecuteAppends(_require, win, function(error) {
                    if (error) {
                        throw error;
                    }
                    originalCallback.apply(win, depsValues);
                });
            });
        };
        win.require.config = _require.config;
        return _require;
    }

    function collectAndExecuteAppends(require, win, done) {
        logger.log("adding appends using requirejs");

        eventSource.emit({
            type: 'addAppends',
            handlers: []
        }, addAppendsDone);

        function addAppendsDone(error, addAppendsEvent) {
            var appends = addAppendsEvent.handlers,
                i = 0;
            if (error) {
                done(error);
            }
            logger.log("adding appends using requirejs");
            execNext();

            function execNext() {
                var append;
                if (i >= appends.length) {
                    done();
                } else {
                    append = appends[i++];
                    if (utils.isString(append)) {
                        require([append], execNext);
                    } else {
                        injector.inject(append);
                        execNext();
                    }
                }
            }
        }
    }

    function patchLoad(_require) {
        var _load = _require.load;
        _require.load = function(context, moduleName, url) {
            var self = this;
            var absUrl = urlParser.makeAbsoluteUrl(url, testframe.win().location.href);
            eventSource.emit({
                type: 'instrumentScript',
                src: absUrl,
                content: null,
                changed: false
            }, instrumentScriptDone);

            function instrumentScriptDone(error, instrumentScriptEvent) {
                var src = instrumentScriptEvent.src;
                if (error) {
                    //Set error on module, so it skips timeout checks.
                    context.registry[moduleName].error = true;
                    throw error;
                }
                if (instrumentScriptEvent.changed) {
                    try {
                        utils.evalScript(testframe.win(), src, instrumentScriptEvent.content);
                        context.completeLoad(moduleName);
                    } catch (e) {
                        //Set error on module, so it skips timeout checks.
                        context.registry[moduleName].error = true;
                        throw e;
                    }
                } else {
                    // use the src from the event
                    // so listeners are able to change this.
                    _load.call(self, context, moduleName, src);
                }
            }
        };
    }
});