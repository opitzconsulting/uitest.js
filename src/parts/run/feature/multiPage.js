uitest.define('run/feature/multiPage', ['run/eventSource', 'run/main', 'run/feature/locationProxy'], function(eventSource, main, locationProxy) {
    eventSource.on('loc:reload', function(event, done) {
        main.start(event.newHref);
        done();
    });
});