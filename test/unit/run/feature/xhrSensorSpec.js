describe('run/feature/xhrSensor', function() {
    var readyModule, injectorModule, win, xhr, sensorInstance, eventSource, addPrependsEvent;
    beforeEach(function() {
        readyModule = {
            addSensor: jasmine.createSpy('addSensor')
        };
        var modules = uitest.require({
            "run/ready": readyModule,
            "run/config": {}
        }, ["run/feature/xhrSensor", "run/injector", "run/eventSource"]);
        sensorInstance = modules["run/feature/xhrSensor"];
        injectorModule = modules["run/injector"];
        eventSource = modules["run/eventSource"];
        xhr = {
            send: jasmine.createSpy('send'),
            open: jasmine.createSpy('open'),
            abort: jasmine.createSpy('abort')
        };
        win = {
            window: {
                XMLHttpRequest: jasmine.createSpy('xhr').andReturn(xhr)
            }
        };
        addPrependsEvent = {
            type: 'addPrepends',
            handlers: []
        };
        eventSource.emit(addPrependsEvent);
        injectorModule.inject(addPrependsEvent.handlers[0], null, [win]);
    });

    it('should add itself to the ready-module', function() {
        expect(readyModule.addSensor).toHaveBeenCalledWith('xhr', sensorInstance);
    });
    it('should add itself as prepend', function() {
        expect(addPrependsEvent.handlers.length).toBe(1);
    });

    it("should forward calls from the instrumented xhr to the original xhr", function() {
        var localXhr = new win.window.XMLHttpRequest();
        expect(localXhr).not.toBe(xhr);
        localXhr.onreadystatechange = jasmine.createSpy('readyStateChange');
        localXhr.open('GET', 'someUrl');
        expect(xhr.open).toHaveBeenCalledWith('GET', 'someUrl');
        localXhr.send();
        expect(xhr.send).toHaveBeenCalledWith();
        localXhr.onreadystatechange = jasmine.createSpy('onreadystatechange');
        xhr.onreadystatechange();
        expect(localXhr.onreadystatechange).toHaveBeenCalled();
    });

    it("should copy the properties of the original xhr to the instrumented xhr", function() {
        var localXhr = new win.window.XMLHttpRequest();
        localXhr.open('GET', 'someUrl');
        localXhr.send();
        xhr.readyState = 2;
        xhr.onreadystatechange();
        expect(localXhr.readyState).toBe(2);
    });

    it("should wait for the xhr", function() {
        expect(sensorInstance()).toEqual({
            ready: true,
            count: 0
        });
        var localXhr = new win.window.XMLHttpRequest();
        localXhr.onreadystatechange = jasmine.createSpy('readyStateChange');
        localXhr.open('GET', 'someUrl');
        localXhr.send();
        expect(sensorInstance()).toEqual({
            ready: false,
            count: 1
        });

        xhr.readyState = 4;
        xhr.onreadystatechange();

        expect(sensorInstance()).toEqual({
            ready: true,
            count: 1
        });

    });
    it("should wait for the xhr to abort", function() {
        expect(sensorInstance()).toEqual({
            ready: true,
            count: 0
        });
        var localXhr = new win.window.XMLHttpRequest();
        localXhr.onreadystatechange = jasmine.createSpy('readyStateChange');
        localXhr.open('GET', 'someUrl');
        localXhr.send();
        expect(sensorInstance()).toEqual({
            ready: false,
            count: 1
        });
        localXhr.abort();
        expect(sensorInstance()).toEqual({
            ready: true,
            count: 1
        });
    });
});