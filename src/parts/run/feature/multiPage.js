uitest.define('run/feature/multiPage', ['run/eventSource', 'run/main', 'run/feature/locationProxy', 'run/feature/fakeHistory', 'global'], function(eventSource, main, locationProxy, fakeHistory, global) {
    eventSource.on('loc:reload', function(event, done) {
        global.setTimeout(function() {
            main.start(event.newHref);
        });
        done();
    });
});