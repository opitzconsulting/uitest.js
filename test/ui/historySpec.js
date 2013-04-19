xdescribe('history', function() {
    var uit = uitest.current;
    uit.url( "../test/ui/fixtures/empty.html");
    // Android: this tests makes testacular reload the page. WHY?
    // - Note: testacular/debug.html does not have the problem,
    // - nor an iframe that loads testacular/debug.html!!
    // IE8/9: fails always
    it('should be able to go back when gone two steps forward using hashchange', function() {
        uit.runs(function(location, history) {
            location.hash = '1';
            location.hash = '2';
            history.back();
        });
        waits(100);
        uit.runs(function(location) {
            expect(location.hash).toBe('#1');
        });
    });
    if (window.history.pushState) {
        // IE10: fails always!
        it('should be able to go back when gone two steps forward using pushState', function() {
            uit.runs(function(location, history) {
                history.pushState(null, '', '#1');
                history.pushState(null, '', '#2');
                history.back();
            });
            waits(100);
            uit.runs(function(location) {
                expect(location.hash).toBe('#1');
            });
        });
    }
});