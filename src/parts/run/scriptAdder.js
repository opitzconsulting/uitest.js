uitest.define('run/scriptAdder', ['run/config', 'run/eventSource'], function(runConfig, eventSource) {
    eventSource.on('addPrepends', addPrepends);
    eventSource.on('addAppends', addAppends);
    return;

    function addPrepends(event, done) {
        var i;
        for (i=0; i<runConfig.prepends.length; i++) {
            event.handlers.push(runConfig.prepends[i]);
        }
        done();
    }

    function addAppends(event, done) {
        var i;
        for (i=0; i<runConfig.appends.length; i++) {
            event.handlers.push(runConfig.appends[i]);
        }
        done();
    }
});