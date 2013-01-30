uitest.require(["factory!ready"], function(readyModuleFactory) {
    describe('readyModule', function() {
        var readyModule, logger;
        beforeEach(function() {
            logger = {
                log: jasmine.createSpy('logger')
            };
            readyModule = readyModuleFactory({
                logger: logger
            });
        });

        describe('createSensors', function() {
            var someSensorFactory, someSensor, config;
            beforeEach(function() {
                someSensorFactory = jasmine.createSpy('someSensorFactory');
                someSensor = jasmine.createSpy();
                someSensorFactory.andReturn(someSensor);
                readyModule.registerSensor('someSensor', someSensorFactory);
                config = {
                    readySensors: ["someSensor"],
                    appends: [],
                    prepends: []
                };
            });

            it('should create registered sensors', function() {
                var sensorInstances = readyModule.createSensors(config);
                expect(someSensorFactory).toHaveBeenCalled();
                expect(sensorInstances.someSensor).toBe(someSensor);
            });

            it('should pass an object with prepend and append to the sensor factory', function() {
                readyModule.createSensors(config);
                var installer = someSensorFactory.mostRecentCall.args[0];
                installer.prepend('somePrependScript');
                installer.append('someAppendScript');
                expect(config.prepends).toEqual(['somePrependScript']);
                expect(config.appends).toEqual(['someAppendScript']);
            });
        });

        describe('ready', function() {
            var someSensorResult, someSensor, callback, readySensorInstances;
            beforeEach(function() {
                jasmine.Clock.useMock();
                someSensorResult = {
                    count: 0,
                    ready: true
                };
                someSensor = jasmine.createSpy('someSensor').andReturn(someSensorResult);
                readySensorInstances = {someSensor: someSensor};
                callback = jasmine.createSpy();

            });
            it('should call the callback after 50ms if no async work happened', function() {
                readyModule.ready({}, callback);
                expect(callback).not.toHaveBeenCalled();
                jasmine.Clock.tick(50);
                expect(callback).toHaveBeenCalled();
            });
            it('should wait until the sensor is ready', function() {
                someSensorResult.ready = false;
                readyModule.ready(readySensorInstances, callback);

                jasmine.Clock.tick(50);
                expect(callback).not.toHaveBeenCalled();
                someSensorResult.ready = true;
                jasmine.Clock.tick(70);
                expect(callback).toHaveBeenCalled();
            });
            it('should wait if the sensor was busy and ready again', function() {
                readyModule.ready(readySensorInstances, callback);
                someSensorResult.count++;

                jasmine.Clock.tick(50);
                expect(callback).not.toHaveBeenCalled();
                jasmine.Clock.tick(70);
                expect(callback).toHaveBeenCalled();
            });
            describe('logging', function() {
                it('should log the sensor names on which it is waiting', function() {
                    someSensorResult.ready = false;
                    readyModule.ready(readySensorInstances, callback);
                    expect(logger.log).toHaveBeenCalledWith('ready waiting for [someSensor]');
                });
            });
        });
    });


});