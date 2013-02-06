uitest.require(["factory!jqmAnimationSensor", "factory!injector"], function (sensorModuleFactory, injectorFactory) {
    describe('xhr sensor', function() {
        var sensorModule, readyModule, config, injectorModule, win, sensorInstance, animationComplete;
        beforeEach(function() {
            readyModule = {
                registerSensor: jasmine.createSpy('registerSensor')
            };
            sensorModule = sensorModuleFactory({
                ready: readyModule
            });
            config = {
                append: jasmine.createSpy('append')
            };
            injectorModule = injectorFactory();
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
            sensorInstance = sensorModule.sensorFactory(config);
            injectorModule.inject(config.append.mostRecentCall.args[0], null, [win]);
        });

        it('should register itself at the ready module', function() {
            expect(readyModule.registerSensor).toHaveBeenCalledWith('$animation', sensorModule.sensorFactory);
        });

        it('should detect jquery animation waiting', function () {
            expect(sensorInstance()).toEqual({count: 0, ready: true});
            var callback = jasmine.createSpy('callback');
            win.window.jQuery.fn.animationComplete(callback);
            expect(sensorInstance()).toEqual({count: 1, ready: false});

            animationComplete.mostRecentCall.args[0]();
            expect(sensorInstance()).toEqual({count: 1, ready: true});
            expect(callback).toHaveBeenCalled();
        });        
    });
});
