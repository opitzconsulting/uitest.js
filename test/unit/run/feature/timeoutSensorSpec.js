describe('run/feature/timeoutSensor', function() {
    var readyModule, config, injectorModule, sensorInstance, handle, setTimeout, clearTimeout, win, otherCallback;
    beforeEach(function() {
        otherCallback = jasmine.createSpy('someOtherCallback');
        readyModule = {
            addSensor: jasmine.createSpy('addSensor')
        };
        config = {
            prepends: [otherCallback]
        };
        var modules = uitest.require({
            "run/ready": readyModule,
            "run/config": config
        }, ["run/feature/timeoutSensor", "run/injector"]);
        injectorModule = modules["run/injector"];
        sensorInstance = modules["run/feature/timeoutSensor"];
        handle = 1;
        setTimeout = jasmine.createSpy('setTimeout').andReturn(handle);
        clearTimeout = jasmine.createSpy('clearTimout');
        win = {
            window: {
                setTimeout: setTimeout,
                clearTimeout: clearTimeout
            }
        };
        injectorModule.inject(config.prepends[0], win, [win]);
    });

    it('should add itself to the ready-module', function() {
        expect(readyModule.addSensor).toHaveBeenCalledWith('timeout', sensorInstance);
    });
    it('should add itself before all other config.prepends', function() {
        expect(config.prepends.length).toBe(2);
        expect(config.prepends[1]).toBe(otherCallback);
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