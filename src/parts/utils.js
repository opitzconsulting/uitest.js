(function() {
    // Note: We only want to call this once,
    // and not on every module instantiation!
    var now = new Date().getTime();

    uitest.define('utils', ['global'], function(global) {
        return {
            isString: isString,
            isFunction: isFunction,
            isArray: isArray,
            testRunTimestamp: testRunTimestamp,
            asyncLoop: asyncLoop,
            orderByPriority: orderByPriority,
            evalScript: evalScript,
            addEventListener: addEventListener,
            removeEventListener: removeEventListener,
            textContent: textContent
        };

        function isString(obj) {
            return obj && obj.slice;
        }

        function isFunction(value) {
            return typeof value === 'function';
        }

        function isArray(value) {
            return global.Object.prototype.toString.apply(value) === '[object Array]';
        }

        function testRunTimestamp() {
            return now;
        }

        function compareByPriority(entry1, entry2) {
            return (entry2.priority || 0) - (entry1.priority || 0);
        }

        function orderByPriority(arr) {
            arr.sort(compareByPriority);
            return arr;
        }

        function asyncLoop(items, handler, loopDone) {
            var i = 0,
                steps = [],
                trampolineRunning = false;

            nextStep();

            // We are using the trampoline pattern from lisp here,
            // to prevent long stack calls when the handler
            // is calling handlerDone in sync!

            function trampoline() {
                if (trampolineRunning) {
                    return;
                }
                trampolineRunning = true;
                while (steps.length) {
                    execStep(steps.shift());
                }
                trampolineRunning = false;
            }

            function execStep(step) {
                handler(step, handlerDone);

                function handlerDone(error) {
                    if (error || step.stopped) {
                        loopDone(error);
                    } else {
                        nextStep();
                    }
                }
            }

            function nextStep() {
                var step;
                if (i < items.length) {
                    i++;
                    step = {
                        item: items[i - 1],
                        index: i - 1,
                        stop: function() {
                            step.stopped = true;
                            this.stopped = true;
                        }
                    };
                    steps.push(step);
                    trampoline();
                } else {
                    loopDone();
                }
            }
        }

        function evalScript(win, scriptUrl, scriptContent) { /*jshint evil:true*/
            if (scriptUrl) {
                scriptContent += "//@ sourceURL=" + scriptUrl;
            }
            win["eval"].call(win, scriptContent);
        }

        function addEventListener(target, type, callback) {
            if (target.nodeName && target.nodeName.toLowerCase() === 'iframe' && type === 'load') {
                // Cross browser way for onload iframe handler
                if (target.attachEvent) {
                    target.attachEvent('onload', callback);
                } else {
                    target.onload = callback;
                }
            } else if (target.addEventListener) {
                target.addEventListener(type, callback, false);
            } else {
                target.attachEvent("on" + type, callback);
            }
        }

        function removeEventListener(target, type, callback) {
            if (target[type] === callback) {
                target[type] = null;
            }
            if (target.removeEventListener) {
                target.removeEventListener(type, callback, false);
            } else {
                target.detachEvent("on" + type, callback);
            }
        }

        function textContent(el, val) {
            if ("text" in el) {
                el.text = val;
            } else {
                if ("innerText" in el) {
                    el.innerHTML = val;
                } else {
                    el.textContent = val;
                }
            }
        }

    });

})();