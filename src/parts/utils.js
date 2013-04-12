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

        function processAsyncEvent(event, listeners, finalNext, finalStop) {
            var i = 0,
                control = {
                    next: nextListener,
                    stop: finalStop
                };

            listeners.sort(compareByPriority);
            nextListener();

            function nextListener() {
                if (i<listeners.length) {
                    i++;
                    listeners[i-1](event, control);
                } else {
                    finalNext();
                }
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
            processAsyncEvent: processAsyncEvent
        };
    });

})();