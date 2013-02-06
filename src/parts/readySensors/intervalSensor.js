uitest.define('intervalSensor', ['ready'], function(ready) {
    
    ready.registerSensor('interval', sensorFactory);

    function sensorFactory(config) {
        var intervals = {},
            intervalStartCounter = 0;

        config.prepend(function(window) {
            var oldInterval = window.setInterval;
            window.setInterval = function (fn, time) {
                var handle = oldInterval(fn, time);
                intervals[handle] = true;
                intervalStartCounter++;
                return handle;
            };

            var oldClearInterval = window.clearInterval;
            window.clearInterval = function (code) {                
                oldClearInterval(code);
                delete intervals[code];
            };
        });

        return state;

        function isReady() {
            var x;
            for (x in intervals) {
                return false;
            }
            return true;
        }

        function state() {
            return {
                count: intervalStartCounter,
                ready: isReady()
            };
        }        
    }

    return {
        sensorFactory: sensorFactory
    };
});
