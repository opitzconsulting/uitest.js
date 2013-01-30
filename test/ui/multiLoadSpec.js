jasmineui.loadUi('/test/ui/jasmine-uiSpec.html', function () {
    describe('multi page handling', function () {
        it("should be able to continue executing after a page reload, however by loosing state", function () {
            var localCounter = 0;
            runs(function () {
                localCounter++;
                jasmineui.persistent.multiPageFlag = 1;
                // trigger a reload by assigning location.href without a hash
                location.href = location.pathname;
            });
            runs(function () {
                expect(document.readyState).toBe("complete");
                expect(localCounter).toBe(0);
                expect(jasmineui.persistent.multiPageFlag).toBe(1);
                jasmineui.persistent.multiPageFlag = 2;
            });
        });
        it("check results1", function () {
            expect(jasmineui.persistent.multiPageFlag).toBe(2);
        });
        it("should handle navigation by clicks to links correctly", function () {
            var localCounter = 0;
            runs(function () {
                localCounter++;
                jasmineui.persistent.multiPageFlag = 1;
                var link = document.createElement('a');
                link.href = location.pathname + '?test=1';
                document.body.appendChild(link);
                jasmineui.simulate(link, 'click');
            });
            runs(function () {
                expect(document.readyState).toBe("complete");
                expect(localCounter).toBe(0);
                expect(jasmineui.persistent.multiPageFlag).toBe(1);
                jasmineui.persistent.multiPageFlag = 2;
            });
        });
        it("check results2", function () {
            expect(jasmineui.persistent.multiPageFlag).toBe(2);
        });
    });
});
