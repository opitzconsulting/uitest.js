uitest.define('run/feature/jqmAnimationSensor', ['run/eventSource', 'run/ready'], function(eventSource, readyModule) {

    var ready = true,
        startCounter = 0;

    eventSource.on('addAppends', function(event,done) {
        event.handlers.push(install);
        done();
    });

    readyModule.addSensor('jqmAnimationSensor', state);

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