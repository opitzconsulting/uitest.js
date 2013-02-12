describe('run/feature/jqmAnimationSensor', function() {
    var readyModule, config, injectorModule, win, sensorInstance, animationComplete, otherCallback;
    beforeEach(function() {
        otherCallback = jasmine.createSpy('someOtherCallback');
        readyModule = {
            addSensor: jasmine.createSpy('addSensor')
        };
        config = {
            appends: [otherCallback]
        };
        var modules = uitest.require({
            "run/ready": readyModule,
            "run/config": config
        }, ["run/feature/jqmAnimationSensor", "run/injector"]);

        sensorInstance = modules["run/feature/jqmAnimationSensor"];
        injectorModule = modules["run/injector"];
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
        injectorModule.inject(config.appends[0], null, [win]);
    });

    it('should add itself to the ready-module', function() {
        expect(readyModule.addSensor).toHaveBeenCalledWith('jqmAnimationSensor', sensorInstance);
    });
    it('should add itself before all other config.appends', function() {
        expect(config.appends.length).toBe(2);
        expect(config.appends[1]).toBe(otherCallback);
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