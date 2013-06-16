describe('script form public url', function() {
    if ("onLine" in window.navigator && !window.navigator.onLine) {
        return;
    }
    it('should be able to load pages with script from public urls', function() {
        var uit = uitest.current;
        uit.url("../test/ui/fixtures/publicScript.html");
        uit.runs(function($) {
            expect($.fn.jquery).toBe("1.9.1");
        });
    });
});