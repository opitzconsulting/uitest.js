uitest.define('logger', ['global'], function(global) {

    function log() {
        return global.console.log.apply(global.console, arguments);
    }

    return {
        log: log
    };
});
