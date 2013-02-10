uitest.define('run/logger', ['global', 'run/config'], function(global, runConfig) {

    function log() {
        if (runConfig.logging) {
            global.console.log.apply(global.console, arguments);
        }
    }

    return {
        log: log
    };
});
