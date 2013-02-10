describe('loadSensor', function() {
    var loadSensorModule, readyModule, globalModule, config, injectorModule;
    beforeEach(function() {
        readyModule = {
            registerSensor: jasmine.createSpy('registerSensor')
        };
        var modules = uitest.require({
            ready: readyModule
        }, ["loadSensor", "injector"]);
        loadSensorModule = modules.loadSensor;
        injectorModule = modules.injector;
        config = {
            append: jasmine.createSpy('append')
        };
    });

    it('should register the sensorFactory at the ready module', function() {
        expect(readyModule.registerSensor).toHaveBeenCalledWith('load', loadSensorModule.sensorFactory);
    });

    describe('waitForReload', function() {
        it('should increment the loadSensor.count and set loadSensor.ready to false', function() {
            var sensorInstance = loadSensorModule.sensorFactory(config);
            var readySensorInstances = {
                load: sensorInstance
            };

            loadSensorModule.waitForReload(readySensorInstances);
            expect(sensorInstance().count).toBe(1);
            expect(sensorInstance().ready).toBe(false);
        });
    });

    describe('loadSensor', function() {
        var sensorInstance;
        beforeEach(function() {
            sensorInstance = loadSensorModule.sensorFactory(config);
        });
        it('should be waiting initially', function() {
            expect(sensorInstance()).toEqual({
                count: 0,
                ready: false
            });
        });
        it('sould wait for the append function to be called and document.readyState==="complete"', function() {
            var doc = {
                readyState: ''
            };
            var lastArgs = config.append.mostRecentCall.args;
            injectorModule.inject(lastArgs[0], null, [{
                document: doc
            }]);
            expect(sensorInstance()).toEqual({
                count: 0,
                ready: false
            });
            doc.readyState = 'complete';
            expect(sensorInstance()).toEqual({
                count: 0,
                ready: true
            });
        });
    });
});