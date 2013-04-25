describe('run/loadSensor', function() {
    var loadSensorModule, readyModule, globalModule, injectorModule, sensorInstance, eventSource, testwin;
    beforeEach(function() {
        readyModule = {
            addSensor: jasmine.createSpy('addSensor'),
            ready: jasmine.createSpy('ready')
        };
        testwin = {
            document: {
                readyState: ''
            },
            setTimeout: jasmine.createSpy('setTimeout')
        };
        testwin.window = testwin;
        var modules = uitest.require({
            "run/ready": readyModule
        }, ["run/loadSensor", "run/injector", "run/eventSource"]);
        loadSensorModule = modules["run/loadSensor"];
        sensorInstance = loadSensorModule;
        injectorModule = modules["run/injector"];
        eventSource = modules["run/eventSource"];
    });

    function simulateAndTestDocumentLoad(loadCount, readyState) {
        var handlers = [];
        eventSource.emit({
            type: 'addAppends',
            handlers: handlers
        });
        injectorModule.inject(handlers[0], null, [testwin]);
        expect(sensorInstance()).toEqual({
            count: loadCount,
            ready: false
        });
        testwin.document.readyState = readyState;
        expect(sensorInstance()).toEqual({
            count: loadCount,
            ready: false
        });
        testwin.setTimeout.mostRecentCall.args[0]();
        expect(sensorInstance()).toEqual({
            count: loadCount,
            ready: true
        });
    }

    it('should add itself to the ready-module', function() {
        expect(readyModule.addSensor).toHaveBeenCalledWith('load', sensorInstance);
    });

    it('should add itself to the appends', function() {
        var handlers = [];
        eventSource.emit({
            type: 'addAppends',
            handlers: handlers
        });
        expect(handlers.length).toBe(1);
    });

    describe('init', function() {
        it('should increment the loadSensor.count and set loadSensor.ready to false', function() {
            loadSensorModule.init();
            expect(sensorInstance().count).toBe(1);
            expect(sensorInstance().ready).toBe(false);
        });
        it('should wait for the append callback and doc to be ready', function() {
            loadSensorModule.init();
            simulateAndTestDocumentLoad(1, "complete");
        });
    });

    describe('loadSensor', function() {
        it('should be waiting initially', function() {
            expect(sensorInstance()).toEqual({
                count: 0,
                ready: false
            });
        });
        it('should wait for the append function to be called and document.readyState==="complete"', function() {
            simulateAndTestDocumentLoad(0, "complete");
        });
        it('should wait for the append function to be called and document.readyState==="interactive"', function() {
            simulateAndTestDocumentLoad(0, "interactive");
        });
    });
});