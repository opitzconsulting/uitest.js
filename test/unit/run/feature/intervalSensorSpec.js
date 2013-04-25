describe('run/feature/intervalSensor', function() {
    var readyModule, injectorModule, sensorInstance, handle, setInterval, clearInterval, testframe, eventSource, addPrependsEvent;
    beforeEach(function() {
        readyModule = {
            addSensor: jasmine.createSpy('addSensor')
        };
        var modules = uitest.require({
            "run/ready": readyModule,
            "run/config": {}
        }, ["run/feature/intervalSensor", "run/injector", "run/eventSource"]);
        injectorModule = modules["run/injector"];
        sensorInstance = modules["run/feature/intervalSensor"];
        eventSource = modules["run/eventSource"];
        handle = 1;
        setInterval = jasmine.createSpy('setInterval').andReturn(handle);
        clearInterval = jasmine.createSpy('clearInterval');
        testframe = {
            window: {
                setInterval: setInterval,
                clearInterval: clearInterval
            }
        };
        addPrependsEvent = {
            type: 'addPrepends',
            handlers: []
        };
        eventSource.emit(addPrependsEvent);
        injectorModule.inject(addPrependsEvent.handlers[0], null, [testframe]);
    });
    it('should add itself to the ready-module', function() {
        expect(readyModule.addSensor).toHaveBeenCalledWith('interval', sensorInstance);
    });
    it('should add itself as prepend', function() {
        expect(addPrependsEvent.handlers.length).toBe(1);
    });
    it('should wait until the interval is canceled', function() {
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