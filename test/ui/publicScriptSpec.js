describe('script form public url', function() {
    it('should be able to load pages with script from public urls', function() {
        var processedJQuery;
        uitest.define('run/test', ['run/scriptInstrumentor'],function(scriptInstrumentor) {
            processedJQuery = false;
            scriptInstrumentor.addPreProcessor(scriptPreProcessor);
        });

        function scriptPreProcessor(event, control) {
            if (event.state.src && event.state.src.indexOf('jquery')!==-1 &&
                event.token.match.indexOf('Released under the MIT license')!==-1) {
                processedJQuery = true;
            }
            control.next();
        }

        var uit = uitest.current;
        uit.url("../test/ui/fixtures/publicScript.html");
        uit.runs(function($) {
            expect($).toBeDefined();
            expect(processedJQuery).toBe(true);
        });
    });
});