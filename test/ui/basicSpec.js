describe('basic', function() {
    var uit = uitest.current;
    uit.url("/test/ui/fixtures/basic.html");

    it('should load the page with the right location set', function() {
        uitest.runs(function(window) {
            expect(window.location.pathname).toBe('/test/ui/fixtures/basic.html');
        });
    });
    describe('append', function() {
        it('function should be called before DOMContentLoaded but after any other script', function() {
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
        it('script should be called before DOMContentLoaded but after any other script', function() {
            uit.append('saveExecState.js');
            uitest.runs(function(savedExecState, execState) {
                expect(savedExecState.state).toBe("end");
                expect(execState).toBe("loaded");
            });

        });
    });
    describe('prepend', function() {
        it('function should be called before any other script', function() {
            var savedExecState, called;
            uit.prepend(function(execState) {
                savedExecState = {
                    state: execState
                };
            });
            uitest.runs(function(execState) {
                expect(savedExecState).toBeTruthy();
                expect(savedExecState.state).toBeUndefined();
                expect(execState).toBe("loaded");
            });
        });
        it('script should be called before any other script', function() {
            uit.prepend('saveExecState.js');
            uitest.runs(function(savedExecState, execState) {
                expect(savedExecState).toBeTruthy();
                expect(savedExecState.state).toBeUndefined();
                expect(execState).toBe("loaded");
            });
        });
    });
    describe('intercept', function() {
        it('should intercept private functions by name', function() {
            var savedData = {};
            uit.intercept({
                scriptUrl: "sayHello.js",
                fnName: "sayHello",
                callback: function(userName, execState, $delegate) {
                    savedData.execState = execState;
                    savedData.$delegate = $delegate;
                    return "intercepted " + userName;
                }
            });
            uitest.runs(function(document) {
                var el = document.getElementById("greeting");
                expect(el.textContent).toBe("intercepted someUser");
                expect(savedData.execState).toBe('start');
            });
        });
    });

    it('should wait for async actions', function() {
        var startDate;
        uitest.runs(function(window, Date) {
            window.setTimeout(function() {}, 300);
            startDate = new Date();
        });
        uitest.runs(function(Date) {
            var endDate = new Date();
            expect(endDate.getTime() - startDate.getTime()).toBeGreaterThan(200);
        });
    });

});