jasmineui.loadUi('/test/ui/jasmine-instrumentInline-uiSpec.html', function () {

    jasmineui.instrumentFunction('sayHello', function(name, original, self, args) {
        var name = args[0];
        return 'Instrumented hello '+name;
    });

    describe('inline script instrumentation', function () {
        it("should replace the original function", function() {
            var div = document.getElementById('greeting');
            expect(div.innerHTML).toBe('Instrumented hello Tobias');
        });
    });
});

