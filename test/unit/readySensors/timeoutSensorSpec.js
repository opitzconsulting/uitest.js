uitest.require(["factory!timeoutSensor", "factory!injector"], function (sensorModuleFactory, injectorFactory) {
    describe('timeout sensor', function() {
        var sensorModule, readyModule, config, injectorModule,
            sensorInstance, handle, setTimeout, clearTimeout, win;
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
            setTimeout = jasmine.createSpy('setTimeout').andReturn(handle);
            clearTimeout = jasmine.createSpy('clearTimout');
            win = {
                window: {
                    setTimeout: setTimeout,
                    clearTimeout: clearTimeout
                }
            };
            injectorModule.inject(config.prepend.mostRecentCall.args[0], null, [win]);
        });

        it('should register itself at the ready module', function() {
            expect(readyModule.registerSensor).toHaveBeenCalledWith('timeout', sensorModule.sensorFactory);
        });
        it('should wait until the timeout is completed', function() {
            expect(sensorInstance()).toEqual({count:0, ready: true});
            expect(win.window.setTimeout(jasmine.createSpy(), 100)).toBe(handle);
            expect(sensorInstance()).toEqual({count:1, ready: false});
            setTimeout.mostRecentCall.args[0]();
            expect(sensorInstance()).toEqual({count:1, ready: true});
        });
        it('should wait until the timeout is canceled', function() {
            expect(sensorInstance()).toEqual({count:0, ready: true});
            var cb = jasmine.createSpy();
            win.window.setTimeout(cb, 100);
            expect(setTimeout).toHaveBeenCalled();
            expect(sensorInstance()).toEqual({count:1, ready: false});
            win.window.clearTimeout(-1);
            expect(sensorInstance()).toEqual({count:1, ready: false});
            win.window.clearTimeout(handle);
            expect(clearTimeout).toHaveBeenCalledWith(handle);
            expect(sensorInstance()).toEqual({count:1, ready: true});
        });
    });
});