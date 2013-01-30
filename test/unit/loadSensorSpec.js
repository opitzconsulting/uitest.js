uitest.require(["factory!loadSensor"], function(loadSensorFactory) {
    describe('loadSensor', function() {
        var loadSensorModule, readyModule;
        beforeEach(function() {
            readyModule = {
                registerSensor: jasmine.createSpy('registerSensor')
            };
            loadSensorModule = loadSensorFactory({
                ready: readyModule
            });
        });

        it('should register the sensorFactory at the ready module', function() {
            expect(readyModule.registerSensor).toHaveBeenCalledWith('load', loadSensorModule.sensorFactory);
        });

        describe('waitForReload', function() {
            it('should increment the loadSensor.count and set loadSensor.ready to false', function() {
                var sensorInstance = loadSensorModule.sensorFactory();
                var readySensorInstances = {
                        load: sensorInstance
                };

                loadSensorModule.waitForReload(readySensorInstances);
                expect(sensorInstance().count).toBe(1);
                expect(sensorInstance().ready).toBe(false);
            });
        });

        describe('loadSensor', function() {

        });

    });
});