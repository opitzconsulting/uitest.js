describe('run/feature/cacheBuster', function() {
    var eventSource, utils, someNow;
    beforeEach(function() {
        var modules = uitest.require({
            "utils": utils,
            "run/config": {}
        }, ["run/feature/cacheBuster", "run/eventSource", "utils"]);
        eventSource = modules["run/eventSource"];
        utils = modules.utils;
    });

    it('makes script urls unique using the testRunTimestamp', function() {
        var event = {
            type: 'instrumentScript',
            src: 'someSrc'
        };
        eventSource.emit(event);
        expect(event.src).toBe('someSrc?'+utils.testRunTimestamp());
    });
});