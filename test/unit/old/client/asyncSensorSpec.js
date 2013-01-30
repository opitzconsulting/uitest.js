jasmineui.require(["factory!client/asyncSensor"], function (asyncSensorFactory) {
    describe("asyncSensor", function () {
        var asyncSensor, globals, logger, instrumentor, config, XMLHttpRequest;
        beforeEach(function() {
            XMLHttpRequest = function() {

            };
            globals = {
                addEventListener: jasmine.createSpy('addEventListener'),
                setTimeout: window.setTimeout,
                clearTimeout: window.clearTimeout,
                setInterval: window.setInterval,
                clearInterval: window.clearInterval,
                XMLHttpRequest: XMLHttpRequest
            };
            logger = {
                log: jasmine.createSpy('log')
            };
            instrumentor = {
                endCall: jasmine.createSpy('endCall')
            };
            config = {
                asyncSensors: []
            };
            asyncSensor = asyncSensorFactory({
                globals: globals,
                logger: logger,
                instrumentor: instrumentor,
                config: config
            });
            jasmine.Clock.useMock();
        });
        describe('afterAsync', function() {
            it('should call the callback after 50ms if no async work happened', function() {
                var callback = jasmine.createSpy();
                asyncSensor.afterAsync(callback);
                expect(callback).not.toHaveBeenCalled();
                jasmine.Clock.tick(40);
                expect(callback).not.toHaveBeenCalled();
                jasmine.Clock.tick(10);
                expect(callback).toHaveBeenCalled();
            });
            it('should call the callback 50ms after the async sensors return false', function() {
                var callback = jasmine.createSpy();
                var someSensor = "someSensor";
                config.asyncSensors = [someSensor];
                asyncSensor.afterAsync(callback);

                jasmine.Clock.tick(40);
                asyncSensor.updateSensor(someSensor, true);
                var i;
                for (i=0; i<3; i++) {
                    jasmine.Clock.tick(50);
                    expect(callback).not.toHaveBeenCalled();
                }

                asyncSensor.updateSensor(someSensor, false);
                jasmine.Clock.tick(40);
                expect(callback).not.toHaveBeenCalled();
                jasmine.Clock.tick(10);
                expect(callback).toHaveBeenCalled();
            });
            it('should only wait for the sensors in the config', function() {
                var callback = jasmine.createSpy();
                var someSensor = "someSensor";
                config.asyncSensors = [someSensor];
                asyncSensor.afterAsync(callback);
                asyncSensor.updateSensor("someOtherSensor", true);
                jasmine.Clock.tick(50);
                expect(callback).toHaveBeenCalled();
            });
        });

        function findCallArgs(spy, filter) {
            var i;
            for (i=0; i<spy.argsForCall.length; i++) {
                if (filter(spy.argsForCall[i])) {
                    return spy.argsForCall[i];
                }
            }
        }

        function fireEndCall() {
            var i;
            for (i=0; i<instrumentor.endCall.argsForCall.length; i++) {
                instrumentor.endCall.argsForCall[i][0]();
            }
        }

        function isAsync() {
            var callback = jasmine.createSpy('callback');
            asyncSensor.afterAsync(callback);
            jasmine.Clock.tick(50);
            return callback.callCount===0;
        }

        describe('load sensor', function() {
            beforeEach(function() {
                config.asyncSensors = ["load"];
            });
            it('should wait for the window.onload and the instrumentor.beforeLoad event', function() {
                var loadEventListener = findCallArgs(globals.addEventListener, function(args) {
                    return args[0] === "load";
                });
                expect(isAsync()).toBe(true);
                fireEndCall();
                expect(isAsync()).toBe(true);
                loadEventListener[1]();
                jasmine.Clock.tick(10);
                expect(isAsync()).toBe(false);
            });

            it('should wait for the instrumentor.beforeLoad and window.onload event', function() {
                var loadEventListener = findCallArgs(globals.addEventListener, function(args) {
                    return args[0] === "load";
                });
                expect(isAsync()).toBe(true);
                loadEventListener[1]();
                expect(isAsync()).toBe(true);
                fireEndCall();
                expect(isAsync()).toBe(true);
                jasmine.Clock.tick(10);
                expect(isAsync()).toBe(false);
            });
        });

        describe('timeout sensor', function() {
            beforeEach(function() {
                config.asyncSensors = ["timeout"];
            });
            it('should wait until the timeout is completed', function() {
                globals.setTimeout(jasmine.createSpy(), 100);
                expect(isAsync()).toBe(true);
                jasmine.Clock.tick(100);
                expect(isAsync()).toBe(false);
            });
            it('should wait until the timeout is canceled', function() {
                var handle = globals.setTimeout(jasmine.createSpy(), 100);
                expect(isAsync()).toBe(true);
                globals.clearTimeout(handle);
                expect(isAsync()).toBe(false);
            });
        });

        describe('interval sensor', function() {
            beforeEach(function() {
                config.asyncSensors = ["interval"];
            });
            it('should wait while intervals are running', function() {
                var intervalCallback = jasmine.createSpy();
                var handle = globals.setInterval(intervalCallback, 10);
                expect(isAsync()).toBe(true);
                jasmine.Clock.tick(50);
                expect(isAsync()).toBe(true);
                globals.clearInterval(handle);
                expect(isAsync()).toBe(false);
            });
        });

        describe('xhr sensor', function() {
            beforeEach(function() {
                config.asyncSensors = ["xhr"];
            });
            var originalXhr;
            beforeEach(function () {
                XMLHttpRequest.prototype = {
                    send:jasmine.createSpy('send').andCallFake(function () {
                        originalXhr = this;
                    }),
                    open:jasmine.createSpy('open'),
                    abort: jasmine.createSpy('abort')
                }
            });
            it("should forward calls from the instrumented xhr to the original xhr", function () {
                var xhr = new globals.XMLHttpRequest();
                xhr.onreadystatechange = jasmine.createSpy('readyStateChange');
                xhr.open('GET', 'someUrl');
                expect(XMLHttpRequest.prototype.open).toHaveBeenCalledWith('GET', 'someUrl');
                xhr.send();
                expect(XMLHttpRequest.prototype.send).toHaveBeenCalledWith();
                xhr.onreadystatechange = jasmine.createSpy('onreadystatechange');
                originalXhr.onreadystatechange();
                expect(xhr.onreadystatechange).toHaveBeenCalled();
            });
            it("should copy the properties of the original xhr to the instrumented xhr", function () {
                var xhr = new globals.XMLHttpRequest();
                xhr.open('GET', 'someUrl');
                xhr.send();
                expect(xhr).not.toBe(originalXhr);
                originalXhr.readyState = 2;
                originalXhr.onreadystatechange();
                expect(xhr.readyState).toBe(2);
            });
            it("should wait for the xhr", function () {
                var xhr = new globals.XMLHttpRequest();
                xhr.onreadystatechange = jasmine.createSpy('readyStateChange');
                xhr.open('GET', 'someUrl');
                xhr.send();
                expect(isAsync()).toBe(true);

                originalXhr.readyState = 4;
                originalXhr.onreadystatechange();

                expect(isAsync()).toBe(false);
            });
            it("should wait for the xhr to abort", function () {
                var xhr = new globals.XMLHttpRequest();
                xhr.onreadystatechange = jasmine.createSpy('readyStateChange');
                xhr.open('GET', 'someUrl');
                xhr.send();
                expect(isAsync()).toBe(true);
                xhr.abort();
                expect(isAsync()).toBe(false);
            });
        });

        it('should detect jquery animation waiting', function () {
            config.asyncSensors = ['$animationComplete'];
            var animationComplete = jasmine.createSpy('animationComplete');
            globals.jQuery = {
                fn: {
                    animationComplete: animationComplete
                }
            };
            fireEndCall();
            var callback = jasmine.createSpy('callback');
            globals.jQuery.fn.animationComplete(callback);
            expect(isAsync()).toBe(true);

            animationComplete.mostRecentCall.args[0]();
            expect(isAsync()).toBe(false);
            expect(callback).toHaveBeenCalled();
        });

        it('should detect jquery transition waiting', function () {
            config.asyncSensors = ['$transitionComplete'];
            var transitionComplete = jasmine.createSpy('transitionComplete');
            globals.jQuery = {
                fn: {
                    transitionComplete: transitionComplete
                }
            };
            fireEndCall();
            var callback = jasmine.createSpy('callback');
            globals.jQuery.fn.transitionComplete(callback);
            expect(isAsync()).toBe(true);

            transitionComplete.mostRecentCall.args[0]();
            expect(isAsync()).toBe(false);
            expect(callback).toHaveBeenCalled();
        });

    });
});
