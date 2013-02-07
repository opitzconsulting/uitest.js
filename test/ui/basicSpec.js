describe('basic', function() {

    createTestSuite("iframe");
    createTestSuite("popup");

    function createTestSuite(loadMode) {
        describe('loadMode ' + loadMode, function() {
            var uit;
            beforeEach(function() {
                runs(function() {
                    uit = uitest.create();
                    uit.loadMode(loadMode);
                    uit.url("/test/ui/fixtures/basic.html");
                });
            });
            afterEach(function() {
                uitest.cleanup();
            });

            function waitsForReady() {
                var ready = false;
                runs(function() {
                    uit.ready(function() {
                        ready = true;
                    });
                });
                waitsFor(function() {
                    return ready;
                });
            }

            function runsAndInject(callback) {
                runs(function() {
                    uit.inject(callback);
                });
            }

            it('should load the page with the right location set', function() {
                waitsForReady();
                runsAndInject(function(window) {
                    expect(window.location.pathname).toBe('/test/ui/fixtures/basic.html');
                });
            });
            describe('append', function() {
                it('function should be called before DOMContentLoaded but after any other script', function() {
                    var savedExecState;
                    runs(function() {
                        uit.append(function(execState) {
                            savedExecState = {
                                state: execState
                            };
                        });
                    });
                    waitsForReady();
                    runsAndInject(function(execState) {
                        expect(savedExecState.state).toBe("end");
                        expect(execState).toBe("loaded");
                    });
                });
                it('script should be called before DOMContentLoaded but after any other script', function() {
                    runs(function() {
                        uit.append('saveExecState.js');
                    });
                    waitsForReady();
                    runsAndInject(function(savedExecState, execState) {
                        expect(savedExecState.state).toBe("end");
                        expect(execState).toBe("loaded");
                    });

                });
            });
            describe('prepend', function() {
                it('function should be called before any other script', function() {
                    var savedExecState, called;
                    runs(function() {
                        uit.prepend(function(execState) {
                            savedExecState = {
                                state: execState
                            };
                        });
                    });
                    waitsForReady();
                    runsAndInject(function(execState) {
                        expect(savedExecState).toBeTruthy();
                        expect(savedExecState.state).toBeUndefined();
                        expect(execState).toBe("loaded");
                    });
                });
                it('script should be called before any other script', function() {
                    runs(function() {
                        uit.prepend('saveExecState.js');
                    });
                    waitsForReady();
                    runsAndInject(function(savedExecState, execState) {
                        expect(savedExecState).toBeTruthy();
                        expect(savedExecState.state).toBeUndefined();
                        expect(execState).toBe("loaded");
                    });
                });
            });
            describe('intercept', function() {
                it('should intercept private functions by name', function() {
                    var savedData = {};
                    runs(function() {
                        uit.intercept({
                            scriptUrl: "sayHello.js",
                            fnName: "sayHello",
                            callback: function(userName, execState, $delegate) {
                                savedData.execState = execState;
                                savedData.$delegate = $delegate;
                                return "intercepted " + userName;
                            }
                        });
                    });
                    waitsForReady();
                    runsAndInject(function(document) {
                        var el = document.getElementById("greeting");
                        expect(el.textContent).toBe("intercepted someUser");
                        expect(savedData.execState).toBe('start');
                    });
                });
            });

            it('should wait for async actions', function() {
                var startDate;
                waitsForReady();
                runsAndInject(function(window, Date) {
                    window.setTimeout(function() {}, 300);
                    startDate = new Date();
                });
                waitsForReady();
                runsAndInject(function(Date) {
                    var endDate = new Date();
                    expect(endDate.getTime() - startDate.getTime()).toBeGreaterThan(200);
                });
            });
        });

    }

});