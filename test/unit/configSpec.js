describe('config', function() {
	var config, configInstance;
	beforeEach(function() {
		config = uitest.require(["config"]).config;
		configInstance = config.create();
	});

	it('should use defaults', function() {
		expect(configInstance.buildConfig()).toEqual({
			readySensors: ['timeout', 'interval', 'xhr', '$animation'],
			prepends: [],
			appends: [],
			intercepts: []
		});
	});

	it('should save the url property', function() {
		var someUrl = 'someUrl';
		expect(configInstance.url(someUrl).url()).toBe(someUrl);
		expect(configInstance.buildConfig().url).toBe(someUrl);
	});

	it('should save the trace property', function() {
		expect(configInstance.trace(true).trace()).toBe(true);
		expect(configInstance.buildConfig().trace).toBe(true);
	});

	it('should save the readySensors property', function() {
		uitest.define('run/readySensors/sensor1', {});
		var sensors = ['sensor1'];
		expect(configInstance.readySensors(sensors).readySensors()).toBe(sensors);
		expect(configInstance.buildConfig().readySensors).toEqual(sensors);
	});

	it('should validate the readySensors property against the available modules', function() {
		expect(function() {
			configInstance.readySensors(["someNonExistentSensor"]);

		}).toThrow(new Error("Could not find the module run/readySensors/someNonExistentSensor"));
	});

	it('should add prepend calls', function() {
		var someFn = function() {};
		expect(configInstance.prepend(someFn)).toBe(configInstance);
		expect(configInstance.buildConfig().prepends).toEqual([someFn]);
	});

	it('should add append calls', function() {
		var someFn = function() {};
		expect(configInstance.append(someFn)).toBe(configInstance);
		expect(configInstance.buildConfig().appends).toEqual([someFn]);
	});

	it('should add intercept calls', function() {
		var someFn = function() {};
		expect(configInstance.intercept(someFn)).toBe(configInstance);
		expect(configInstance.buildConfig().intercepts).toEqual([someFn]);
	});

	it('should not change the configuration if sealed', function() {
		var error = "This configuration cannot be modified.";
		configInstance.sealed(true);
		try {
			configInstance.url("someUrl");
			throw new Error("expected an error");
		} catch(e) {
			expect(e.message).toBe(error);
		}
		try {
			configInstance.prepend(true);
			throw new Error("expected an error");
		} catch(e) {
			expect(e.message).toBe(error);
		}
	});


	describe('config inheritance', function() {
		var child;
		beforeEach(function() {
			child = config.create();
			child.parent(configInstance);
		});
		it('should inherit normal properties', function() {
			var someValue = 'someValue';
			configInstance._data.someProp = someValue;
			expect(child.buildConfig().someProp).toBe(someValue);
		});
		it('should override normal properties', function() {
			var someValue = 'someValue';
			configInstance._data.someProp = 'someBaseValue';
			child._data.someProp = someValue;
			expect(child.buildConfig().someProp).toBe(someValue);
		});
		it('should merge array properties of data adder properties', function() {
			function dataAdderArr() {
				var res = Array.prototype.slice.call(arguments);
				res.dataAdder = true;
				return res;
			}

			configInstance._data.someProp = dataAdderArr(1);
			child._data.someProp = dataAdderArr(2);
			expect(child.buildConfig().someProp).toEqual([1, 2]);
		});
		it('should not merge array properties of non data adder properties', function() {
			configInstance._data.someProp = [1];
			child._data.someProp = [2];
			expect(child.buildConfig().someProp).toEqual([2]);
		});
	});
});