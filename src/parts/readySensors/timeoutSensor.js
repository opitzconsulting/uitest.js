uitest.define('timeoutSensor', ['ready'], function(ready) {
    
    ready.registerSensor('timeout', sensorFactory);

    function sensorFactory(config) {
        var timeouts = {},
            timoutStartCounter = 0;

        config.prepend(function(window) {
            var oldTimeout = window.setTimeout;
            window.setTimeout = function (fn, time) {
                var handle;
                var callback = function () {
                    delete timeouts[handle];
                    if (typeof fn == 'string') {
                        window.eval(fn);
                    } else {
                        fn();
                    }
                };
                handle = oldTimeout(callback, time);
                timeouts[handle] = true;
                timoutStartCounter++;
                return handle;
            };

            var oldClearTimeout = window.clearTimeout;
            window.clearTimeout = function (code) {                
                oldClearTimeout(code);
                delete timeouts[code];
            };
        });

        return state;

        function isReady() {
            var x;
            for (x in timeouts) {
                return false;
            }
            return true;
        }

        function state() {
            return {
                count: timoutStartCounter,
                ready: isReady()
            };
        }        
    }

    return {
        sensorFactory: sensorFactory
    };
});
