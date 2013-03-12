describe('regression', function() {
    var uit = uitest.current;
    uit.url("../test/ui/fixtures/basic.html");

    describe('issue 8: Setting and returning hash', function() {
        it('should allow to change the hash without a reload', function() {
            uit.runs(function(window) {
                window.flag = true;
                window.location.hash = 'test';
                expect(window.location.hash).toBe('#test');
            });
            uit.runs(function(window) {
                expect(window.flag).toBe(true);
                expect(window.location.hash).toBe('#test');
            });
        });
    });
});