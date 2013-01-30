jasmineui.define('client/asyncSensor', ['globals', 'logger', 'instrumentor', 'config'], function (globals, logger, instrumentor, config) {
    var oldTimeout = globals.setTimeout;
    var oldClearTimeout = globals.clearTimeout;
    var oldClearInterval = globals.clearInterval;
    var oldSetInterval = globals.setInterval;

    var asyncSensorStates = {};

    var asyncStateListeners = [];

    /**
     * Updates the state of a sensor.
     *
     * @param name
     * @param asyncProcessing Whether the sensor detected async processing.
     */
    function updateSensor(name, asyncProcessing) {
        asyncSensorStates[name] = asyncProcessing;
        logger.log("async wait state changed: " + name + "=" + asyncProcessing, asyncSensorStates);
        checkAndCallAsyncListeners();
    }

    function waitForAsyncProcessingState(state, listener) {
        asyncStateListeners.push({asyncProcessing:state, listener:listener});
        checkAndCallAsyncListeners();
    }

    function checkAndCallAsyncListeners() {
        var asyncProcessing = isAsyncProcessing();
        var i, entry;
        for (i = asyncStateListeners.length - 1; i >= 0; i--) {
            entry = asyncStateListeners[i];
            if (entry.asyncProcessing === asyncProcessing) {
                asyncStateListeners.splice(i, 1);
                entry.listener();
            }
        }
    }

    function isAsyncProcessing() {
        var i , sensorName;
        var asyncProcessing = false;
        for (i = 0; i < config.asyncSensors.length; i++) {
            sensorName = config.asyncSensors[i];
            if (asyncSensorStates[sensorName]) {
                return true;
            }
        }
        return false;
    }

    // Goal:
    // - Detect async work that cannot detected before some time after it's start
    //   (e.g. the WebKitAnimationStart event is not fired until some ms after the dom change that started the animation).
    // - Detect the situation where async work starts another async work
    //
    // Algorithm:
    // Wait until asyncSensor is false for 50ms.
    function afterAsync(listener) {
        function restart() {
            logger.log("begin async waiting");
            waitForAsyncProcessingState(false, function () {
                var handle = oldTimeout(function () {
                    logger.log("end async waiting");
                    listener();
                }, 50);
                waitForAsyncProcessingState(true, function () {
                    oldClearTimeout(handle);
                    restart();
                });
            });
        }

        restart();
    }

    /**
     * Adds an async sensor for the load event
     */
    (function () {
        var loadEvent = false;
        var endCall = false;
        globals.addEventListener('load', function () {
            // Also listen for the globals.load event, as instrumentor.endCall
            // is fired before all images, ... are loaded (in non requirejs case).
            loadEvent = true;
            changed();
        });
        instrumentor.endCall(function () {
            // Note: endCall is called before the real application starts.
            // However, it supports requirejs.
            oldTimeout(function () {
                endCall = true;
                changed();
            }, 10);
        });
        function changed() {
            updateSensor('load', !loadEvent || !endCall);
        }

        changed();
    })();

    /**
     * Adds an async sensor for the globals.setTimeout function.
     */
    (function () {
        var timeouts = {};
        globals.setTimeout = function (fn, time) {
            var handle;
            var callback = function () {
                delete timeouts[handle];
                changed();
                if (typeof fn == 'string') {
                    eval(fn);
                } else {
                    fn();
                }
            };
            handle = oldTimeout(callback, time);
            timeouts[handle] = true;
            changed();
            return handle;
        };

        globals.clearTimeout = function (code) {
            oldClearTimeout(code);
            delete timeouts[code];
            changed();
        };
        function changed() {
            var count = 0;
            for (var x in timeouts) {
                count++;
            }
            updateSensor('timeout', count != 0);
        }
    })();

    /**
     * Adds an async sensor for the globals.setInterval function.
     */
    (function () {
        var intervals = {};
        globals.setInterval = function (fn, time) {
            var callback = function () {
                if (typeof fn == 'string') {
                    eval(fn);
                } else {
                    fn();
                }
            };
            var res = oldSetInterval(callback, time);
            intervals[res] = 'true';
            changed();
            return res;
        };

        globals.clearInterval = function (code) {
            oldClearInterval(code);
            delete intervals[code];
            changed();
        };

        function changed() {
            var count = 0;
            for (var x in intervals) {
                count++;
            }
            updateSensor('interval', count != 0);
        }
    })();

    /**
     * Adds an async sensor for the globals.XMLHttpRequest.
     */
    (function () {
        var jasmineWindow = window;
        var copyStateFields = ['readyState', 'responseText', 'responseXML', 'status', 'statusText'];
        var proxyMethods = ['abort', 'getAllResponseHeaders', 'getResponseHeader', 'open', 'send', 'setRequestHeader'];

        var oldXHR = globals.XMLHttpRequest;
        globals.openCallCount = 0;
        var DONE = 4;
        var newXhr = function () {
            var self = this;
            this.origin = new oldXHR();

            function copyState() {
                for (var i = 0; i < copyStateFields.length; i++) {
                    var field = copyStateFields[i];
                    try {
                        self[field] = self.origin[field];
                    } catch (_) {
                    }
                }
            }

            function proxyMethod(name) {
                self[name] = function () {
                    if (name == 'send') {
                        change(1);
                    } else if (name == 'abort') {
                        change(-1);
                    }
                    var res = self.origin[name].apply(self.origin, arguments);
                    copyState();
                    return res;
                }
            }

            for (var i = 0; i < proxyMethods.length; i++) {
                proxyMethod(proxyMethods[i]);
            }
            this.origin.onreadystatechange = function () {
                if (self.origin.readyState == DONE) {
                    change(-1);
                }
                copyState();
                if (self.onreadystatechange) {
                    self.onreadystatechange.apply(self.origin, arguments);
                }
            };
            copyState();
        };
        globals.XMLHttpRequest = newXhr;

        function change(difference) {
            globals.openCallCount += difference;
            updateSensor('xhr', globals.openCallCount != 0);
        }
    })();

    /**
     * Adds an async sensor for $.fn.animationComplete.
     */
    (function () {
        var animationCount = 0;
        instrumentor.endCall(function () {
            var jQuery = globals.jQuery;
            if (!(jQuery && jQuery.fn && jQuery.fn.animationComplete)) {
                return;
            }
            var oldFn = jQuery.fn.animationComplete;
            jQuery.fn.animationComplete = function (callback) {
                change(1);
                return oldFn.call(this, function () {
                    change(-1);
                    return callback.apply(this, arguments);
                });
            };
            function change(difference) {
                animationCount += difference;
                updateSensor('$animationComplete', animationCount != 0);
            }
        });

    })();

    /**
     * Adds an async sensor for $.fn.transitionComplete.
     */
    (function () {
        var transitionCount = 0;
        instrumentor.endCall(function () {
            var jQuery = globals.jQuery;
            if (!(jQuery && jQuery.fn && jQuery.fn.transitionComplete)) {
                return;
            }

            var oldFn = jQuery.fn.transitionComplete;
            jQuery.fn.transitionComplete = function (callback) {
                change(1);
                return oldFn.call(this, function () {
                    change(-1);
                    return callback.apply(this, arguments);
                });
            };
            function change(difference) {
                transitionCount += difference;
                updateSensor('$transitionComplete', transitionCount != 0);
            }
        });
    })();


    return {
        updateSensor:updateSensor,
        afterAsync:afterAsync
    };
});