uitest.define('jqmAnimationSensor', ['ready'], function(ready) {

    ready.registerSensor('$animation', sensorFactory);

    function sensorFactory(config) {
        var ready = true,
            startCounter = 0;

        config.append(function(window) {
            var jQuery = window.jQuery;
            if(!(jQuery && jQuery.fn && jQuery.fn.animationComplete)) {
                return;
            }

            var oldFn = jQuery.fn.animationComplete;
            jQuery.fn.animationComplete = function(callback) {
                startCounter++;
                ready = false;
                return oldFn.call(this, function() {
                    ready = true;
                    return callback.apply(this, arguments);
                });
            };
        });

        return state;

        function state() {
            return {
                count: startCounter,
                ready: ready
            };
        }
    }

    return {
        sensorFactory: sensorFactory
    };
});