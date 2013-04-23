describe('script form public url', function() {
    it('should be able to load pages with script from public urls', function() {
        var processedJQuery;
        uitest.define('run/test', ['run/eventSource'],function(eventSource) {
            processedJQuery = false;
            eventSource.on('js:blockcomment', scriptPreProcessor);
        });

        function scriptPreProcessor(event, done) {
            if (event.state.scriptUrl && event.state.scriptUrl.indexOf('jquery')!==-1 &&
                event.token.match.indexOf('Released under the MIT license')!==-1) {
                processedJQuery = true;
            }
            done();
        }

        var uit = uitest.current;
        uit.url("../test/ui/fixtures/publicScript.html");
        uit.runs(function($) {
            expect($).toBeDefined();
            expect(processedJQuery).toBe(true);
        });
    });
});