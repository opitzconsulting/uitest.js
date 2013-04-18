(function() {
    // Note: We only want to call this once,
    // and not on every module instantiation!
    var now = new Date().getTime();

    uitest.define('utils', ['global'], function(global) {
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

        function asyncLoop(items, handler, finalNext, stop) {
            var i = 0,
                steps = [],
                loopRunning = false,
                control = {
                    next: nextStep,
                    stop: stop
                };

            nextStep();

            // We are using the trampoline pattern from lisp here,
            // to prevent long stack calls when the handler
            // is calling control.next in sync!
            function loop() {
                var itemAndIndex;
                if (loopRunning) {
                    return;
                }
                loopRunning = true;
                while (steps.length) {
                    itemAndIndex = steps.shift();
                    handler(itemAndIndex.index, itemAndIndex.item, control);
                }
                loopRunning = false;
            }

            function nextStep() {
                if (i<items.length) {
                    i++;
                    steps.push({
                        item: items[i-1],
                        index: i-1
                    });
                    loop();
                } else {
                    finalNext();
                }
            }
        }

        function processAsyncEvent(event, listeners, finalNext, stop) {
            listeners.sort(compareByPriority);
            asyncLoop(listeners, handler, finalNext, stop);

            function handler(index, listener, control) {
                listener(event, control);
            }
        }

        function compareByPriority(entry1, entry2) {
            return (entry2.priority || 0) - (entry1.priority || 0);
        }

        return {
            isString: isString,
            isFunction: isFunction,
            isArray: isArray,
            testRunTimestamp: testRunTimestamp,
            processAsyncEvent: processAsyncEvent,
            asyncLoop: asyncLoop
        };
    });

})();