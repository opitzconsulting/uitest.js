describe('run/ready', function() {
    var readyModule, logger, injector;
    beforeEach(function() {
        injector = {
            inject: jasmine.createSpy('inject').andCallFake(function(callback) {
                callback();
            })
        };
        logger = {
            log: jasmine.createSpy('logger')
        };
        readyModule = uitest.require({
            "run/injector": injector,
            "run/logger": logger
        }, ["run/ready"])["run/ready"];
    });

    describe('ready', function() {
        var someSensorResult, someSensor, callback;
        beforeEach(function() {
            jasmine.Clock.useMock();
            someSensorResult = {
                count: 0,
                ready: true
            };
            someSensor = jasmine.createSpy('someSensor').andReturn(someSensorResult);
            readyModule.addSensor("someSensor", someSensor);
            callback = jasmine.createSpy();
        });
        it('should call the callback after 50ms if no async work happened', function() {
            readyModule.ready(callback);
            expect(callback).not.toHaveBeenCalled();
            jasmine.Clock.tick(50);
            expect(callback).toHaveBeenCalled();
        });
        it('should wait until the sensor is ready', function() {
            someSensorResult.ready = false;
            readyModule.ready(callback);

            jasmine.Clock.tick(10);
            expect(callback).not.toHaveBeenCalled();
            someSensorResult.ready = true;
            jasmine.Clock.tick(60);
            expect(callback).toHaveBeenCalled();
        });
        it('should wait if the sensor was busy and ready again', function() {
            readyModule.ready(callback);
            someSensorResult.count++;

            jasmine.Clock.tick(50);
            expect(callback).not.toHaveBeenCalled();
            jasmine.Clock.tick(50);
            expect(callback).toHaveBeenCalled();
        });
        it('should log the sensor names on which it is waiting', function() {
            someSensorResult.ready = false;
            readyModule.ready(callback);
            expect(logger.log).toHaveBeenCalledWith('ready waiting for [someSensor]');
        });
        it('should do dependency injection on the callback', function() {
            var callbackArgs;
            callback = function(someGlobal) {
                callbackArgs = arguments;
            };

            readyModule.ready(callback);
            jasmine.Clock.tick(50);
            expect(injector.inject).toHaveBeenCalledWith(callback, null, []);
        });
    });
});
