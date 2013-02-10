describe('requirejsDataMain', function() {
    var uit = uitest.current;
    uit.url("/test/ui/fixtures/requirejsDataMain.html");

    afterEach(function() {
        uitest.cleanup();
    });

    describe('append', function() {
        it('should exec append functions before the require callback', function() {
            var savedExecState;
            uit.append(function(execState) {
                savedExecState = {
                    state: execState
                };
            });
            uitest.runs(function(execState) {
                expect(savedExecState.state).toBe("end");
                expect(execState).toBe("loaded");
            });
        });
        it('should load append scripts before the require callback', function() {
            uit.append("saveExecState.js");
            uitest.runs(function(savedExecState, execState) {
                expect(savedExecState.state).toBe("end");
                expect(execState).toBe("loaded");
            });
        });
    });
});