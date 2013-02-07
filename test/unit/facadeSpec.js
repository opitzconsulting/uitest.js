uitest.require(["factory!facade"], function(facadeFactory) {
	describe('facade', function() {

		var facade, urlLoader, readyModule, loadSensorModule, instrumentorModule, frame, global;
		beforeEach(function() {
			global = {};
			frame = {};
			urlLoader = {
				open: jasmine.createSpy('urlLoader').andReturn(frame),
				close: jasmine.createSpy('close')
			};
			loadSensorModule = {
				sensorFactory: jasmine.createSpy('loadSensorFactory'),
				waitForReload: jasmine.createSpy('waitForReload'),
				sensorName: 'load'
			};
			readyModule = {
				ready: jasmine.createSpy('ready'),
				reloaded: jasmine.createSpy('reloaded'),
				createSensors: jasmine.createSpy('createSensors')
			};
			instrumentorModule = {
				init: jasmine.createSpy('createWithConfig')
			};
			facade = facadeFactory({
				global: global,
				urlLoader: urlLoader,
				ready: readyModule,
				loadSensor: loadSensorModule,
				instrumentor: instrumentorModule
			});
		});

		describe('create', function() {
			it('should create a new object on every call', function() {
				expect(facade.create()).not.toBe(facade.create());
			});
            it('should register a global', function() {
                expect(global.uitest.create).toBe(facade.create);
            });
		});

		describe('cleanup', function() {
			it('should call urlLoader.cleanup()', function() {
				facade.cleanup();
				expect(urlLoader.close).toHaveBeenCalled();
			});
            it('should register a global', function() {
                expect(global.uitest.cleanup).toBe(facade.cleanup);
            });
		});

		describe('current', function() {
			it('should be defined', function() {
				expect(facade.current).toBeDefined();
			});
			it('should delegate to a new instance if no currentIdAccessor is set', function() {
				expect(facade.current.url('someUrl').url()).toBe('someUrl');
			});
			it('should replace uitest instance results by the facade', function() {
				var uit = facade.current.url('someUrl');
				expect(uit).toBe(facade.current);
			});
			it('should delegate to separate instance depending on the result of currentIdAccessor', function() {
				var currentIdAccessor = jasmine.createSpy('currentIdAccessor'),
					uit = facade.current;
				facade.currentIdAccessor(currentIdAccessor);
				
				currentIdAccessor.andReturn('1');
				expect(uit.url('someUrl1').url()).toBe('someUrl1');
				expect(uit.parent()).toBeFalsy();

				currentIdAccessor.andReturn('2');
				expect(uit.url('someUrl2').url()).toBe('someUrl2');
				expect(uit.parent()).toBeFalsy();

				currentIdAccessor.andReturn('1');
				expect(uit.url()).toBe('someUrl1');

				currentIdAccessor.andReturn('2');
				expect(uit.url()).toBe('someUrl2');
			});
			it('should set the parent in the uitest instance using id substring', function() {
				var currentIdAccessor = jasmine.createSpy('currentIdAccessor'),
					uit = facade.current;
				facade.currentIdAccessor(currentIdAccessor);

				currentIdAccessor.andReturn('1');
				uit.url('parentUrl');

				currentIdAccessor.andReturn('1.1');
				expect(uit.parent().url()).toBe('parentUrl');
			});
            it('should register a global', function() {
                expect(global.uitest.current).toBe(facade.current);
            });
		});

		describe('config delegation', function() {
			var uit;
			beforeEach(function() {
				uit = facade.create();
			});
			it('should delegate config methods to a config instance', function() {
				uit.url("someUrl");
				expect(uit._config._data.url).toBe("someUrl");
			});
			it('should replace config results by uitest instance', function() {
				expect(uit.url("someUrl")).toBe(uit);
				expect(uit.url("someUrl").url()).toBe("someUrl");
			});
			it('sould replace uitest instances in arguments by the config', function() {
				var child = facade.create();
				child.parent(uit);
				expect(child._config._parent).toBe(uit._config);
			});

		});

		describe('instance methods', function() {
			describe('ready', function() {
				var uit;
				beforeEach(function() {
					uit = facade.create();
					uit.readySensors([]);
				});

				describe('first call', function() {
					it('should build a runInstance', function() {
						uit.ready();
						expect(uit._runInstance).toBeDefined();
						expect(uit._runInstance.config).toBeDefined();
					});

					it('should seal the config', function() {
						uit.ready();
						expect(uit._config.sealed()).toBe(true);
					});

					it('should always add the load sensor', function() {
						uit.ready();
						expect(uit._runInstance.config.readySensors).toEqual([loadSensorModule.sensorName]);
					});

					it('should call readyModel.createSensors', function() {
						var callback = jasmine.createSpy('callback');
						uit.ready(callback);
						expect(readyModule.createSensors).toHaveBeenCalledWith(uit._runInstance.config);
					});

					it('should call the urlLoader module', function() {
						var callback = jasmine.createSpy('callback');
						uit.ready(callback);
						expect(urlLoader.open).toHaveBeenCalledWith(uit._runInstance.config);
					});

					it('should init the instrumentor', function() {
						uit.ready();
						expect(instrumentorModule.init).toHaveBeenCalledWith(uit._runInstance.config);
					});

					it('should call readyModule.ready with dependency injection', function() {
						var callbackArgs;
						var callback = function(someGlobal) {
							callbackArgs = arguments;
						};
						uit.ready(callback);
						expect(callbackArgs).toBeUndefined();
						frame.someGlobal = "someGlobal";
						var lastCallArgs = readyModule.ready.mostRecentCall.args;
						lastCallArgs[1]();
						expect(callbackArgs).toEqual([frame.someGlobal]);
					});

				});

				describe('further calls', function() {
					it('should delegate to the readyModule.ready with dependency injection', function() {
						var callbackArgs;
						var callback = function(someGlobal) {
							callbackArgs = arguments;
						};
						uit.ready(callback);
						readyModule.ready.reset();
						uit.ready(callback);
						expect(callbackArgs).toBeUndefined();
						frame.someGlobal = "someGlobal";
						readyModule.ready.mostRecentCall.args[1]();
						expect(callbackArgs).toEqual([frame.someGlobal]);
					});
				});
			});

			describe('reloaded', function() {
				it('should call loadSensor.waitForReload and then ready', function() {
					var callback = jasmine.createSpy('callback');
					var uit = facade.create();
					uit._runInstance = {
						readySensorInstances: {}
					};
					spyOn(uit, "ready");
					uit.reloaded(callback);
					expect(loadSensorModule.waitForReload).toHaveBeenCalledWith(uit._runInstance.readySensorInstances);
					expect(uit.ready).toHaveBeenCalledWith(callback);
				});
			});

			describe('inject', function() {
				var uit;
				beforeEach(function() {
					uit = facade.create();
				});
				it('should throw an error if not started yet', function() {
					try {
						uit.inject();
						throw new Error("expected an error");
					} catch (e) {
						expect(e.message).toBe("The test page has not yet loaded. Please call ready first");
					}
				});
				it('should use the current frame for dependency injection', function() {
					uit._runInstance = {
						frame: {
							someGlobal: 'someValue'
						}
					};
					var callbackArgs;
					var callback = function(someGlobal) {
						callbackArgs = arguments;
					};
					uit.inject(callback);
					expect(callbackArgs).toEqual(['someValue']);
				});
			});

		});

	});

});