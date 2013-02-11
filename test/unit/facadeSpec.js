describe('facade', function() {

	var facade, readyModule, loadSensorModule, instrumentorModule, frame, global;
	beforeEach(function() {
		global = {};
		frame = {};
		loadSensorModule = {
			sensorFactory: jasmine.createSpy('loadSensorFactory'),
			waitForReload: jasmine.createSpy('waitForReload'),
			sensorName: 'load'
		};
		readyModule = {
			ready: jasmine.createSpy('ready'),
			addSensor: jasmine.createSpy('addSensor')
		};
		instrumentorModule = {
			init: jasmine.createSpy('createWithConfig')
		};
		facade = uitest.require({
			global: global,
			ready: readyModule,
			loadSensor: loadSensorModule,
			instrumentor: instrumentorModule
		}, ["facade"]).facade;
	});

	describe('create', function() {
		it('should create a new object on every call', function() {
			expect(facade.create()).not.toBe(facade.create());
		});
		it('should register a global', function() {
			expect(global.uitest.create).toBe(facade.create);
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
		it('should use the longest parent id possible', function() {
			var currentIdAccessor = jasmine.createSpy('currentIdAccessor'),
				uit = facade.current;
			facade.currentIdAccessor(currentIdAccessor);

			currentIdAccessor.andReturn('1');
			uit.url('parent1Url');

			currentIdAccessor.andReturn('1.1');
			uit.url('parent2Url');

			currentIdAccessor.andReturn('1.1.1');
			expect(uit.parent().url()).toBe('parent2Url');

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
				spyOn(uitest, "require").andCallFake(function(cache) {
					cache["run/ready"] = readyModule;
					return cache;
				});
			});

			describe('first call', function() {
				it('should require all run modules expect ready sensors', function() {
					uit.ready();
					expect(uitest.require).toHaveBeenCalled();
					var moduleFilter = uitest.require.argsForCall[0][1];
					expect(moduleFilter("someNonRunModule")).toBe(false);
					expect(moduleFilter("run/someRunModule")).toBe(true);
					expect(moduleFilter("run/readySensors/someSensor")).toBe(false);
				});
				it('should require the specified ready sensors', function() {
					uitest.define('run/readySensors/someSensor', {});
					uit.readySensors(["someSensor"]);
					uit.ready();
					expect(uitest.require).toHaveBeenCalled();
					var sensorModules = uitest.require.mostRecentCall.args[1];
					expect(sensorModules).toEqual(['run/readySensors/load', 'run/readySensors/someSensor']);
				});
				it('should always require the load sensor', function() {
					uit.ready();
					var sensorModules = uitest.require.argsForCall[1][1];
					expect(sensorModules).toEqual(["run/readySensors/load"]);
				});
				it('should register readySensors at the ready-module', function() {
					var someSensor = jasmine.createSpy('someSensor');
					var loadSensor = jasmine.createSpy('loadSensor');
					uitest.define('run/readySensors/someSensor', someSensor);
					uit.readySensors(["someSensor"]);
					uitest.require.andCallFake(function(cache) {
						cache["run/ready"] = readyModule;
						cache["run/readySensors/someSensor"] = someSensor;
						cache["run/readySensors/load"] = loadSensor;
						return cache;
					});
					uit.ready();
					expect(readyModule.addSensor).toHaveBeenCalledWith("someSensor", someSensor);
					expect(readyModule.addSensor).toHaveBeenCalledWith("load", loadSensor);
				});

				it('should seal the config', function() {
					uit.ready();
					expect(uit._config.sealed()).toBe(true);
				});
				it('should provide config.buildConfig() as run/config module', function() {
					var someRunConfig = {a: 2, readySensors: []};
					spyOn(uit._config, 'buildConfig').andReturn(someRunConfig);
					uit.ready();
					var args = uitest.require.mostRecentCall.args;
					expect(args[0]["run/config"]).toBe(someRunConfig);
				});
				it('should call readyModule.ready with the given callback', function() {
					var someCallback = jasmine.createSpy('callback');
					uit.ready(someCallback);
					expect(readyModule.ready).toHaveBeenCalledWith(someCallback);
				});
			});

			describe('further calls', function() {
				it('should no more call uitest.require', function() {
					uit.ready();
					uitest.require.reset();
					uit.ready();
					expect(uitest.require).not.toHaveBeenCalled();
				});
				it('should call readyModule.ready with the given callback', function() {
					uit.ready();
					var someCallback = jasmine.createSpy('callback');
					uit.ready(someCallback);
					expect(readyModule.ready).toHaveBeenCalledWith(someCallback);
				});
			});
		});

		describe('reloaded', function() {
			it('should call loadSensor.reloaded', function() {
				var callback = jasmine.createSpy('callback');
				var uit = facade.create();
				uit._runModules = {
					"run/loadSensor": {
						reloaded: jasmine.createSpy('reloaded')
					}
				};
				uit.reloaded(callback);
				expect(uit._runModules["run/loadSensor"].reloaded).toHaveBeenCalledWith(callback);
			});
			it('should throw an error if ready was not called before', function() {
				var uit = facade.create();
				expect(function() {
					uit.reloaded();
				}).toThrow(new Error("The test page has not yet loaded. Please call ready first"));
			});
		});

		describe('inject', function() {
			var uit;
			beforeEach(function() {
				uit = facade.create();
			});
			it('should throw an error if ready was not called before', function() {
				expect(function() {
					uit.inject();
				}).toThrow(new Error("The test page has not yet loaded. Please call ready first"));
			});
			it('should use the testframe for dependency injection', function() {
				uit._runModules = {
					"run/testframe": {
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