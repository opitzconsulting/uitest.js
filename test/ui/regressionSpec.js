describe('regression', function() {
    var uit = uitest.current;

    describe('issue 8 and 9: Setting and returning hash', function() {
        var relPath = "../test/ui/fixtures/basic.html";
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
    describe('issue 14: using $.animate', function() {
        it('should allow $.animate', function() {
            var el;
            uit.url( "../test/ui/fixtures/animateFixture.html");
            uit.runs(function($) {
                el = $('#pages');
                el.animate({'left':'200px'});
            });
            uit.runs(function($) {
                expect(el.css('left')).toBe('200px');
            });
        });
    });
});