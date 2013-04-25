describe('run/feature/timeoutSensor', function() {
    var readyModule, injectorModule, sensorInstance, handle, setTimeout, clearTimeout, win, eventSource, addPrependsEvent;
    beforeEach(function() {
        readyModule = {
            addSensor: jasmine.createSpy('addSensor')
        };
        var modules = uitest.require({
            "run/ready": readyModule,
            "run/config": {}
        }, ["run/feature/timeoutSensor", "run/injector", "run/eventSource"]);
        injectorModule = modules["run/injector"];
        sensorInstance = modules["run/feature/timeoutSensor"];
        eventSource = modules["run/eventSource"];
        handle = 1;
        setTimeout = jasmine.createSpy('setTimeout').andReturn(handle);
        clearTimeout = jasmine.createSpy('clearTimout');
        win = {
            window: {
                setTimeout: setTimeout,
                clearTimeout: clearTimeout
            }
        };
        addPrependsEvent = {
            type: 'addPrepends',
            handlers: []
        };
        eventSource.emit(addPrependsEvent);
        injectorModule.inject(addPrependsEvent.handlers[0], null, [win]);
    });

    it('should add itself to the ready-module', function() {
        expect(readyModule.addSensor).toHaveBeenCalledWith('timeout', sensorInstance);
    });
    it('should add itself as prepend', function() {
        expect(addPrependsEvent.handlers.length).toBe(1);
    });
    it('should wait until the timeout is completed', function() {
        expect(sensorInstance()).toEqual({
            count: 0,
            ready: true
        });
        expect(win.window.setTimeout(jasmine.createSpy(), 100)).toBe(handle);
        expect(sensorInstance()).toEqual({
            count: 1,
            ready: false
        });
        setTimeout.mostRecentCall.args[0]();
        expect(sensorInstance()).toEqual({
            count: 1,
            ready: true
        });
    });
    it('should wait until the timeout is canceled', function() {
        expect(sensorInstance()).toEqual({
            count: 0,
            ready: true
        });
        var cb = jasmine.createSpy();
        win.window.setTimeout(cb, 100);
        expect(setTimeout).toHaveBeenCalled();
        expect(sensorInstance()).toEqual({
            count: 1,
            ready: false
        });
        win.window.clearTimeout(-1);
        expect(sensorInstance()).toEqual({
            count: 1,
            ready: false
        });
        win.window.clearTimeout(handle);
        expect(clearTimeout).toHaveBeenCalledWith(handle);
        expect(sensorInstance()).toEqual({
            count: 1,
            ready: true
        });
    });
});