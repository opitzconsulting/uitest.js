describe('run/feature/xhrSensor', function() {
    var readyModule, config, injectorModule, win, xhr, sensorInstance, otherCallback;
    beforeEach(function() {
        otherCallback = jasmine.createSpy('someOtherCallback');
        readyModule = {
            addSensor: jasmine.createSpy('addSensor')
        };
        config = {
            prepends: [otherCallback]
        };
        var modules = uitest.require({
            "run/ready": readyModule,
            "run/config": config
        }, ["run/feature/xhrSensor", "run/injector"]);
        sensorInstance = modules["run/feature/xhrSensor"];
        injectorModule = modules["run/injector"];
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
        injectorModule.inject(config.prepends[0], win, [win]);
    });

    it('should add itself to the ready-module', function() {
        expect(readyModule.addSensor).toHaveBeenCalledWith('xhr', sensorInstance);
    });
    it('should add itself before all other config.prepends', function() {
        expect(config.prepends.length).toBe(2);
        expect(config.prepends[1]).toBe(otherCallback);
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