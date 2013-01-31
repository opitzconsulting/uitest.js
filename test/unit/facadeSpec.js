uitest.require(["factory!facade"], function(facadeFactory) {
	describe('facade', function() {

		var facade, urlLoader, readyModule, loadSensorModule;
		beforeEach(function() {
			urlLoader = jasmine.createSpy('urlLoader');
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
			facade = facadeFactory({
				urlLoader: urlLoader,
				ready: readyModule,
				loadSensor: loadSensorModule
			});
		});

		// TODO assert that the current mode is run mode
		// on every inject, ... later.
		// TODO test that the default sensors are set...
		
		describe('create', function() {
			it('should create a new object on every call', function() {
				expect(facade.create()).not.toBe(facade.create());
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

		});

		describe('instance methods', function() {
			describe('ready', function() {
				var uit;
				beforeEach(function() {
					uit = facade.create();
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

					it('should call readyModule.ready', function() {
						var callback = jasmine.createSpy('callback');
						uit.ready(callback);
						expect(callback).not.toHaveBeenCalled();
						var lastCallArgs = readyModule.ready.mostRecentCall.args;
						lastCallArgs[1]();
						expect(callback).toHaveBeenCalled();
					});

					it('should call readyModel.createSensors', function() {
						var callback = jasmine.createSpy('callback');
						uit.ready(callback);
						expect(readyModule.createSensors).toHaveBeenCalledWith(uit._runInstance.config);
					});

					it('should call the urlLoader module', function() {
						var callback = jasmine.createSpy('callback');
						uit.ready(callback);
						expect(urlLoader).toHaveBeenCalledWith(uit._runInstance);
					});
				});

				describe('further calls', function() {
					it('should delegate to the readyModule.ready', function() {
						var callback = jasmine.createSpy('callback');
						uit.ready(callback);
						readyModule.ready.reset();
						urlLoader.reset();
						uit.ready(callback);
						expect(callback).not.toHaveBeenCalled();
						readyModule.ready.mostRecentCall.args[1]();
						expect(callback).toHaveBeenCalled();
					});
				});
			});

			describe('readyLatch', function() {
				var uit;
				beforeEach(function() {
					uit = facade.create();
					spyOn(uit, "ready");
				});
				it('should call this.ready once when the latch is called first', function() {
					var latch = uit.readyLatch();
					expect(uit.ready).not.toHaveBeenCalled();
					expect(latch()).toBe(0);
					expect(uit.ready).toHaveBeenCalled();
				});
				it('should return 1 when the call to this.ready resolved', function() {
					var latch = uit.readyLatch();
					latch();
					uit.ready.mostRecentCall.args[0]();
					expect(latch()).toBe(1);
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

		});

	});

});