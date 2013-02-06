uitest.require(["factory!intervalSensor", "factory!injector"], function (sensorModuleFactory, injectorFactory) {
    describe('interval sensor', function() {
        var sensorModule, readyModule, config, injectorModule,
            sensorInstance, handle, setInterval, clearInterval, win;
        beforeEach(function() {
            readyModule = {
                registerSensor: jasmine.createSpy('registerSensor')
            };
            sensorModule = sensorModuleFactory({
                ready: readyModule
            });
            config = {
                prepend: jasmine.createSpy('prepend')
            };
            injectorModule = injectorFactory();
            sensorInstance = sensorModule.sensorFactory(config);
            handle = 1;
            setInterval = jasmine.createSpy('setInterval').andReturn(handle);
            clearInterval = jasmine.createSpy('clearInterval');
            win = {
                window: {
                    setInterval: setInterval,
                    clearInterval: clearInterval
                }
            };
        });

        it('should register itself at the ready module', function() {
            expect(readyModule.registerSensor).toHaveBeenCalledWith('interval', sensorModule.sensorFactory);
        });
        it('should wait until the interval is canceled', function() {
            injectorModule.inject(config.prepend.mostRecentCall.args[0], null, [win]);

            expect(sensorInstance()).toEqual({count:0, ready: true});
            var cb = jasmine.createSpy();
            expect(win.window.setInterval(cb, 100)).toBe(handle);
            expect(setInterval).toHaveBeenCalledWith(cb, 100);
            expect(sensorInstance()).toEqual({count:1, ready: false});
            win.window.clearInterval(-1);
            expect(sensorInstance()).toEqual({count:1, ready: false});
            win.window.clearInterval(handle);
            expect(clearInterval).toHaveBeenCalledWith(handle);
            expect(sensorInstance()).toEqual({count:1, ready: true});
        });
    });
});