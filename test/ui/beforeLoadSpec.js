jasmineui.loadUi('/test/ui/jasmine-uiSpec.html', function () {
    describe("beforeLoad and hook functions", function () {
        var state = 0;
        afterEach(function () {
            expect(state).toBe(4);
            state++;
            runs(function () {
                expect(state).toBe(5);
            });
        });
        beforeEach(function () {
            expect(state).toBe(1);
            state++;
            runs(function () {
                expect(state).toBe(2);
                state++;
            });
        });
        jasmineui.beforeLoad(function () {
            expect(state).toBe(0);
            state++;
            expect(document.readyState).not.toBe("complete");
        });
        it("should execute the hook functions in the right order", function () {
            runs(function () {
                expect(state).toBe(3);
                expect(document.readyState).toBe("complete");

                state++;
            });
        });
    });

    var counter = 0;
    jasmineui.beforeLoad(function() {
        counter++;
    });
    describe('multiple beforeLoads', function() {
        describe('suite1', function() {
            jasmineui.beforeLoad(function() {
                counter++;
            });
            it("should increment the counter ignoring other beforeLoads", function() {
                expect(counter).toBe(2);
            });
        });
        describe('suite2', function() {
            jasmineui.beforeLoad(function() {
                counter++;
            });
            it("should increment the counter ignoring other beforeLoads", function() {
                expect(counter).toBe(2);
            });

        })
    });

    describe('beforeLoad and end scripts', function() {
        var stateInBeforeLoad;
        jasmineui.beforeLoad(function() {
            stateInBeforeLoad = window.sampleEndScript;
        });
        it('should call beforeLoad after end scripts', function() {
            expect(stateInBeforeLoad).toBe(true);
        });
    });
});
