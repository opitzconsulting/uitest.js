describe('mobile', function() {
    var uit = uitest.current;

    function findViewportMeta(doc) {
        var metas = doc.getElementsByTagName("meta"),
            meta,
            i;
        for (i=0; i<metas.length; i++) {
            meta = metas[i];
            if (meta.getAttribute('name')==='viewport') {
                return meta;
            }
        }
        return null;
    }

    uit.feature("mobileViewport");

    it('should add a viewport-meta tag to the top frame', function() {
        uit.url("../test/ui/fixtures/mobile.html");
        uit.runs(function(window) {
            var topDoc = window.top.document;
            var meta = findViewportMeta(topDoc);
            expect(meta.getAttribute("content")).toBe('width=device-width');
        });
    });

    it('should remove a viewport-meta tag from the top frame', function() {
        uit.url("../test/ui/fixtures/basic.html");
        uit.runs(function(window) {
            var topDoc = window.top.document;
            expect(findViewportMeta(topDoc)).toBeFalsy();
        });
    });
});