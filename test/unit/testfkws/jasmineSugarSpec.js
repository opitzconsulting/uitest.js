describe('jasmineSugar', function() {
    var jasmineSugar, facade, jasmineEnv, global, currentUitest;
    beforeEach(function() {
        currentUitest = {
            ready: jasmine.createSpy('ready'),
            reloaded: jasmine.createSpy('reloaded'),
            inject: jasmine.createSpy('inject')
        };
        jasmineEnv = {

        };
        facade = {
            currentIdAccessor: jasmine.createSpy('currentIdAccessor'),
            current: currentUitest
        };
    });
    describe('without jasmine', function() {
        var jasmineSugar;
        beforeEach(function() {
            jasmineSugar = uitest.require({
                facade: facade,
                global: {}
            }, ["jasmineSugar"]).jasmineSugar;
        });
        it('should not register the currentIdAccessor', function() {
            expect(facade.currentIdAccessor).not.toHaveBeenCalled();
        });
        it('should not register globals', function() {
            expect(jasmineSugar).toEqual({});
        });
    });
    describe('with jasmine', function() {
        beforeEach(function() {
            global = {
                waitsFor: jasmine.createSpy('waitsFor'),
                runs: jasmine.createSpy('runs'),
                jasmine: {
                    getEnv: jasmine.createSpy('getEnv').andReturn(jasmineEnv)
                }
            };
            jasmineSugar = uitest.require({
                facade: facade,
                global: global
            }, ["jasmineSugar"]).jasmineSugar;
        });

        describe('currentIdAccessor', function() {
            it('should register the currentIdAccessor at facade', function() {
                expect(facade.currentIdAccessor).toHaveBeenCalledWith(jasmineSugar.currentIdAccessor);
            });
            it('should return an empty string if outside of any suite', function() {
                expect(jasmineSugar.currentIdAccessor()).toBe('');
            });
            it("should return the id of the suite and it's parent suites if outside of a spec", function() {
                jasmineEnv.currentSuite = {
                    id: 2,
                    parentSuite: {
                        id: 1
                    }
                };
                expect(jasmineSugar.currentIdAccessor()).toBe('su1.su2');
            });
            it("should return the id of the suite and it's parent suites if outside of a spec but env.currentSpec is still filled", function() {
                jasmineEnv.currentSuite = {
                    id: 2,
                    parentSuite: {
                        id: 1
                    }
                };
                jasmineEnv.currentSpec = {
                    queue: {
                        running: false
                    }
                };
                expect(jasmineSugar.currentIdAccessor()).toBe('su1.su2');
            });
            it("should return the ids of the current spec with it's parent suites separated by a colon", function() {
                jasmineEnv.currentSpec = {
                    id: 3,
                    suite: {
                        id: 2,
                        parentSuite: {
                            id: 1
                        }
                    },
                    queue: {
                        running: true
                    }
                };
                expect(jasmineSugar.currentIdAccessor()).toBe("su1.su2.sp3");
            });

        });
        describe('runs', function() {
            it('should wait with jasmine.waitsFor and uitest.current.ready', function() {
                var callback = jasmine.createSpy('callback');
                jasmineSugar.runs(callback);
                expect(global.runs.callCount).toBe(2);
                expect(global.waitsFor).toHaveBeenCalled();
                expect(currentUitest.ready).not.toHaveBeenCalled();
                global.runs.argsForCall[0][0]();
                expect(currentUitest.ready).toHaveBeenCalled();
                expect(global.waitsFor.mostRecentCall.args[0]()).toBe(false);
                currentUitest.ready.mostRecentCall.args[0]();
                expect(global.waitsFor.mostRecentCall.args[0]()).toBe(true);
            });
            it('should forward a timeout to jasmine.waitsFor', function() {
                var callback = jasmine.createSpy('callback');
                var someTimeout = 1234;
                jasmineSugar.runs(callback, someTimeout);
                expect(global.waitsFor.mostRecentCall.args[1]).toBe("uitest.ready");
                expect(global.waitsFor.mostRecentCall.args[2]).toBe(someTimeout);
            });
            it('should execute the given callback using uitest.current.inject after waiting', function() {
                var callback = jasmine.createSpy('callback');
                jasmineSugar.runs(callback);
                expect(currentUitest.inject).not.toHaveBeenCalled();
                global.runs.argsForCall[1][0]();
                expect(currentUitest.inject).toHaveBeenCalledWith(callback);
            });
            it('should register a global', function() {
                expect(global.uitest.current.runs).toBe(jasmineSugar.runs);
            });
        });
        describe('runsAfterReload', function() {
            it('should wait with jasmine.waitsFor and uitest.current.reloaded', function() {
                var callback = jasmine.createSpy('callback');
                jasmineSugar.runsAfterReload(callback);
                expect(global.runs.callCount).toBe(2);
                expect(global.waitsFor).toHaveBeenCalled();
                expect(currentUitest.reloaded).not.toHaveBeenCalled();
                global.runs.argsForCall[0][0]();
                expect(currentUitest.reloaded).toHaveBeenCalled();
                expect(global.waitsFor.mostRecentCall.args[0]()).toBe(false);
                currentUitest.reloaded.mostRecentCall.args[0]();
                expect(global.waitsFor.mostRecentCall.args[0]()).toBe(true);
            });
            it('should forward a timeout to jasmine.waitsFor', function() {
                var callback = jasmine.createSpy('callback');
                var someTimeout = 1234;
                jasmineSugar.runsAfterReload(callback, someTimeout);
                expect(global.waitsFor.mostRecentCall.args[1]).toBe("uitest.reloaded");
                expect(global.waitsFor.mostRecentCall.args[2]).toBe(someTimeout);
            });
            it('should execute the given callback using uitest.current.inject after waiting', function() {
                var callback = jasmine.createSpy('callback');
                jasmineSugar.runs(callback);
                expect(currentUitest.inject).not.toHaveBeenCalled();
                global.runs.argsForCall[1][0]();
                expect(currentUitest.inject).toHaveBeenCalledWith(callback);
            });
            it('should register a global', function() {
                expect(global.uitest.current.runsAfterReload).toBe(jasmineSugar.runsAfterReload);
            });
        });
    });
});