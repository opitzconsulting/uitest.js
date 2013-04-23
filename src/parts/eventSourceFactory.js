uitest.define('eventSourceFactory', ['utils'], function(utils) {

    function noop() {

    }

    return eventSourceFactory;

    function eventSourceFactory() {
        var listeners = {};
        return {
            on: on,
            emit: emit
        };


        function on(eventName, listener) {
            var eventListeners = listeners[eventName] = listeners[eventName] || [];
            eventListeners.push(listener);
            utils.orderByPriority(eventListeners);
        }

        function emit(event, emitDone) {
            var eventName,
                eventListeners,
                anyEventListeners = listeners['*'],
                i;
            event = event || {};
            if (typeof event === "string") {
                eventName = event;
                event = {
                    type: eventName
                };
            } else {
                eventName = event.type;
            }
            if (!eventName) {
                throw new Error("No event type given");
            }
            eventListeners = listeners[eventName] || [];
            if (anyEventListeners) {
                eventListeners = anyEventListeners.concat(eventListeners);
            }
            emitDone = emitDone || noop;
            utils.asyncLoop(eventListeners, asyncLoopHandler, asyncLoopDone);

            function asyncLoopHandler(loopData, done) {
                var eventListener = loopData.item;
                event.stop = loopData.stop;
                eventListener(event, done);
            }

            function asyncLoopDone(error) {
                emitDone(error, event);
            }

        }
    }
});