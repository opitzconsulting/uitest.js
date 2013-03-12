describe('regression', function() {
    var uit = uitest.current,
        relPath = "../test/ui/fixtures/basic.html";

    describe('issue 8 and 9: Setting and returning hash', function() {
        it('should allow to change the hash without a reload', function() {
            uit.url(relPath);
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
        it('should return "#/page1.html"', function() {
            uit.url( relPath + "#/page1.html");
            uit.runs(function(window) {
                expect(window.location.hash).toBe('#/page1.html');
            });
        });
    });
});