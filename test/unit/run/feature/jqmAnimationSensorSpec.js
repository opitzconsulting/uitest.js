describe('run/feature/jqmAnimationSensor', function() {
    var readyModule, injectorModule, win, sensorInstance, animationComplete, eventSource, addAppendsEvent;
    beforeEach(function() {
        readyModule = {
            addSensor: jasmine.createSpy('addSensor')
        };
        var modules = uitest.require({
            "run/ready": readyModule,
            "run/config": {}
        }, ["run/feature/jqmAnimationSensor", "run/injector", "run/eventSource"]);

        sensorInstance = modules["run/feature/jqmAnimationSensor"];
        injectorModule = modules["run/injector"];
        eventSource = modules["run/eventSource"];
        animationComplete = jasmine.createSpy(animationComplete);
        win = {
            window: {
                jQuery: {
                    fn: {
                        animationComplete: animationComplete
                    }
                }
            }
        };
        addAppendsEvent = {
            type: 'addAppends',
            handlers: []
        };
        eventSource.emit(addAppendsEvent);
        injectorModule.inject(addAppendsEvent.handlers[0], null, [win]);
    });
    it('should add itself to the ready-module', function() {
        expect(readyModule.addSensor).toHaveBeenCalledWith('jqmAnimationSensor', sensorInstance);
    });
    it('should add itself as append', function() {
        expect(addAppendsEvent.handlers.length).toBe(1);
    });

    it('should detect jquery animation waiting', function() {
        expect(sensorInstance()).toEqual({
            count: 0,
            ready: true
        });
        var callback = jasmine.createSpy('callback');
        win.window.jQuery.fn.animationComplete(callback);
        expect(sensorInstance()).toEqual({
            count: 1,
            ready: false
        });

        animationComplete.mostRecentCall.args[0]();
        expect(sensorInstance()).toEqual({
            count: 1,
            ready: true
        });
        expect(callback).toHaveBeenCalled();
    });
});