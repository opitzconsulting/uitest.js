describe('run/feature/intervalSensor', function() {
    var readyModule, config, injectorModule, sensorInstance, handle, setInterval, clearInterval, testframe, otherCallback;
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
        }, ["run/feature/intervalSensor", "run/injector"]);
        injectorModule = modules["run/injector"];
        sensorInstance = modules["run/feature/intervalSensor"];
        handle = 1;
        setInterval = jasmine.createSpy('setInterval').andReturn(handle);
        clearInterval = jasmine.createSpy('clearInterval');
        testframe = {
            window: {
                setInterval: setInterval,
                clearInterval: clearInterval
            }
        };
    });
    it('should add itself to the ready-module', function() {
        expect(readyModule.addSensor).toHaveBeenCalledWith('interval', sensorInstance);
    });
    it('should add itself before all other config.prepends', function() {
        expect(config.prepends.length).toBe(2);
        expect(config.prepends[1]).toBe(otherCallback);
    });
    it('should wait until the interval is canceled', function() {
        injectorModule.inject(config.prepends[0], testframe, [testframe]);

        expect(sensorInstance()).toEqual({
            count: 0,
            ready: true
        });
        var cb = jasmine.createSpy();
        expect(testframe.window.setInterval(cb, 100)).toBe(handle);
        expect(setInterval).toHaveBeenCalledWith(cb, 100);
        expect(sensorInstance()).toEqual({
            count: 1,
            ready: false
        });
        testframe.window.clearInterval(-1);
        expect(sensorInstance()).toEqual({
            count: 1,
            ready: false
        });
        testframe.window.clearInterval(handle);
        expect(clearInterval).toHaveBeenCalledWith(handle);
        expect(sensorInstance()).toEqual({
            count: 1,
            ready: true
        });
    });
});