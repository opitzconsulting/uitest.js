jasmineui.loadUi('/test/ui/jasmine-instrumentUrlScript-uiSpec.html', function () {

    jasmineui.instrumentFunction('sayHello', function(name, original, self, args) {
        var name = args[0];
        return 'Instrumented hello '+name;
    });

    describe('url script instrumentation', function () {
        it("should replace the original function", function() {
            var div = document.getElementById('greeting');
            expect(div.innerHTML).toBe('Instrumented hello Tobias');
        });
    });
});

