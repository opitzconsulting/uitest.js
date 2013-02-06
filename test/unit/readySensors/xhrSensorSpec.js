uitest.require(["factory!xhrSensor", "factory!injector"], function (sensorModuleFactory, injectorFactory) {
    describe('xhr sensor', function() {
        var sensorModule, readyModule, config, injectorModule, win, xhr, sensorInstance;
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
            xhr = {
                send:jasmine.createSpy('send'),
                open:jasmine.createSpy('open'),
                abort: jasmine.createSpy('abort')
            };
            win = {
                window: {
                    XMLHttpRequest: jasmine.createSpy('xhr').andReturn(xhr)
                }
            };       
            sensorInstance = sensorModule.sensorFactory(config);
            injectorModule.inject(config.prepend.mostRecentCall.args[0], null, [win]);
        });

        it('should register itself at the ready module', function() {
            expect(readyModule.registerSensor).toHaveBeenCalledWith('xhr', sensorModule.sensorFactory);
        });

        it("should forward calls from the instrumented xhr to the original xhr", function () {
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

        it("should copy the properties of the original xhr to the instrumented xhr", function () {
            var localXhr = new win.window.XMLHttpRequest();
            localXhr.open('GET', 'someUrl');
            localXhr.send();
            xhr.readyState = 2;
            xhr.onreadystatechange();
            expect(localXhr.readyState).toBe(2);
        });

        it("should wait for the xhr", function () {
            expect(sensorInstance()).toEqual({ready: true, count: 0});
            var localXhr = new win.window.XMLHttpRequest();
            localXhr.onreadystatechange = jasmine.createSpy('readyStateChange');
            localXhr.open('GET', 'someUrl');
            localXhr.send();
            expect(sensorInstance()).toEqual({ready: false, count: 1});

            xhr.readyState = 4;
            xhr.onreadystatechange();

            expect(sensorInstance()).toEqual({ready: true, count: 1});

        });
        it("should wait for the xhr to abort", function () {
            expect(sensorInstance()).toEqual({ready: true, count: 0});
            var localXhr = new win.window.XMLHttpRequest();
            localXhr.onreadystatechange = jasmine.createSpy('readyStateChange');
            localXhr.open('GET', 'someUrl');
            localXhr.send();
            expect(sensorInstance()).toEqual({ready: false, count: 1});
            localXhr.abort();
            expect(sensorInstance()).toEqual({ready: true, count: 1});
        }); 
    });
});