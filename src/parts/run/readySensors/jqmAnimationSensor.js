uitest.define('run/jqmAnimationSensor', ['run/ready', 'run/config'], function(readyModule, runConfig) {

    var ready = true,
        startCounter = 0;

    readyModule.addSensor('$animation', state);
    runConfig.appends.unshift(install);

    return state;

    function install(window) {
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
    }

    function state() {
        return {
            count: startCounter,
            ready: ready
        };
    }
});