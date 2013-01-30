jasmineui.loadUi('/test/ui/jasmine-uiSpec.html', function () {

    var sampleBeginScriptState = window.sampleBeginScript;
    var sampleEndScriptStates = {
        begin: window.sampleEndScript
    };

    window.addEventListener('DOMContentLoaded', function() {
        sampleEndScriptStates.end = window.sampleEndScript
    }, false);

    describe('helper script injection', function () {
        it("should execute position=begin before test scripts", function() {
            expect(sampleBeginScriptState).toBe(true);
        });

        it("should execute position=end before the document load event if not using requirejs", function () {
            expect(sampleEndScriptStates.begin).toBeUndefined();
            expect(sampleEndScriptStates.end).toBe(true);
            expect(window.sampleEndScript).toBe(true);
        });
    });
});

