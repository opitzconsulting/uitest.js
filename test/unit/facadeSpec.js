describe('facade', function() {

	var facade, readyModule, loadSensorModule, instrumentorModule, frame, global, sniffer;
	beforeEach(function() {
		global = {
		};
		frame = {};
		sniffer = jasmine.createSpy('sniffer');
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
			instrumentor: instrumentorModule,
			sniffer: sniffer
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

			currentIdAccessor.andReturn('su1');
			uit.url('parent1Url');

			currentIdAccessor.andReturn('su1.su2');
			uit.url('parent2Url');

			currentIdAccessor.andReturn('su1.su2.sp0');
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
				spyOn(uitest, "require").andCallFake(function(cache) {
					cache["run/ready"] = readyModule;
					return cache;
				});
			});

			describe('first call', function() {
				it('should wait for the sniffer and provide it"s result as a run module', function() {
					uit.ready();
					expect(sniffer).toHaveBeenCalled();
					expect(uitest.require).not.toHaveBeenCalled();
					var someRunSniffer = {};
					sniffer.mostRecentCall.args[0](someRunSniffer);
					expect(uitest.require).toHaveBeenCalled();
					expect(uitest.require.mostRecentCall.args[0]["run/sniffer"]).toBe(someRunSniffer);
				});
				it('should require all run modules expect features', function() {
					uit.ready();
					sniffer.mostRecentCall.args[0]({});
					expect(uitest.require).toHaveBeenCalled();
					var moduleFilter = uitest.require.argsForCall[0][1];
					expect(moduleFilter("someNonRunModule")).toBe(false);
					expect(moduleFilter("run/someRunModule")).toBe(true);
					expect(moduleFilter("run/feature/someFeature")).toBe(false);
				});
				it('should require the specified features', function() {
					uitest.define('run/feature/someFeature', {});
					uit.feature("someFeature");
					uit.ready();
					sniffer.mostRecentCall.args[0]({});
					expect(uitest.require).toHaveBeenCalled();
					var featureModules = uitest.require.mostRecentCall.args[1];
					expect(featureModules).toEqual(['run/feature/someFeature']);
				});
				it('should seal the config', function() {
					uit.ready();
					sniffer.mostRecentCall.args[0]({});
					expect(uit._config.sealed()).toBe(true);
				});
				it('should provide config.buildConfig() as run/config module', function() {
					var someRunConfig = {a: 2, features: []};
					spyOn(uit._config, 'buildConfig').andReturn(someRunConfig);
					uit.ready();
					sniffer.mostRecentCall.args[0]({});
					var args = uitest.require.mostRecentCall.args;
					expect(args[0]["run/config"]).toBe(someRunConfig);
				});
				it('should call readyModule.ready with the given callback', function() {
					var someCallback = jasmine.createSpy('callback');
					uit.ready(someCallback);
					sniffer.mostRecentCall.args[0]({});
					expect(readyModule.ready).toHaveBeenCalledWith(someCallback);
				});
			});

			describe('further calls', function() {
				it('should no more call uitest.require', function() {
					uit.ready();
					sniffer.mostRecentCall.args[0]({});
					uitest.require.reset();
					sniffer.reset();
					uit.ready();
					expect(sniffer).not.toHaveBeenCalled();
					expect(uitest.require).not.toHaveBeenCalled();
				});
				it('should call readyModule.ready with the given callback', function() {
					uit.ready();
					sniffer.mostRecentCall.args[0]({});
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
			it('should use the injector for dependency injection', function() {
				var inject = jasmine.createSpy('inject');
				uit._runModules = {
					"run/injector": {
						inject: inject
					}
				};
				var callback = function() {};
				uit.inject(callback);
				expect(inject).toHaveBeenCalledWith(callback, null, []);
			});
		});
	});
});