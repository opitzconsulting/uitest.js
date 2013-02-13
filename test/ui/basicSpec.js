describe('basic', function() {
    var uit = uitest.current;
    uit.url("../test/ui/fixtures/basic.html");

    it('should load the page with the right location set', function() {
        function endsWith(string, end) {
            return string.substring(string.length-end.length) === end;
        }

        uit.runs(function(window) {
            expect(endsWith(window.location.pathname, 'ui/fixtures/basic.html')).toBe(true);
        });
    });
    describe('inject', function() {
        it('should inject variables from the iframe', function() {
            var win = window;
            uit.runs(function(window) {
                window.test = true;
            });
            runs(function() {
                uit.inject(function(test) {
                    expect(test).toBe(true);
                    expect(win.test).toBeUndefined();
                });
            });
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
            uit.runs(function(execState) {
                expect(savedExecState.state).toBe("end");
                expect(execState).toBe("loaded");
            });
        });
        it('script should be called before DOMContentLoaded but after any other script', function() {
            uit.append('saveExecState.js');
            uit.runs(function(savedExecState, execState) {
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
            uit.runs(function(execState) {
                expect(savedExecState).toBeTruthy();
                expect(savedExecState.state).toBeUndefined();
                expect(execState).toBe("loaded");
            });
        });
        it('script should be called before any other script', function() {
            uit.prepend('saveExecState.js');
            uit.runs(function(savedExecState, execState) {
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
                script: "sayHello.js",
                fn: "sayHello",
                callback: function(userName, execState, $delegate) {
                    savedData.execState = execState;
                    savedData.$delegate = $delegate;
                    return "intercepted " + userName;
                }
            });
            uit.runs(function(document) {
                var el = document.getElementById("greeting");
                expect(el.textContent).toBe("intercepted someUser");
                expect(savedData.execState).toBe('start');
            });
        });
    });

    it('should wait for async actions', function() {
        var startDate;
        uit.runs(function(window, Date) {
            window.setTimeout(function() {}, 300);
            startDate = new Date();
        });
        uit.runs(function(Date) {
            var endDate = new Date();
            expect(endDate.getTime() - startDate.getTime()).toBeGreaterThan(200);
        });
    });

    it('should wait for page reload', function() {
        uit.runs(function(window, location) {
            window.flag = true;
            location.reload();
        });
        uit.runsAfterReload(function(window) {
            expect(window.flag).toBeUndefined();
        });
    });

});