uitest.define('run/feature/multiPage', ['run/feature/locationProxy', 'run/main'], function(locationProxy, main) {
    locationProxy.addChangeListener(locationChangeListener);


    function locationChangeListener(event) {
        if (event.type === 'reload') {
            main.start(event.newHref);
        }
    }
});