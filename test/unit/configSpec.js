uitest.require(["factory!config"], function (configFactory) {
	var config;
	beforeEach(function() {
		config = configFactory({
		});
	});

	describe('config', function() {
		var configInstance;
		beforeEach(function() {
			configInstance = config.create();
		});

		it('should save and validate the url property', function() {
			var someUrl = 'someUrl';
			configInstance.url(someUrl);
			expect(configInstance.buildConfig().url).toBe(someUrl);
		});

		it('should save and validate the loadMode property', function() {
			try {
				configInstance.loadMode("someMode");
				throw new Error("expected an error");
			} catch (e) {
				expect(e.message).toBe("unknown mode: someMode");
			}
			configInstance.loadMode("iframe");
			expect(configInstance.buildConfig().loadMode).toBe("iframe");
			configInstance.loadMode("popup");
			expect(configInstance.buildConfig().loadMode).toBe("popup");
		});

		it('should save the readySensors property', function() {
			var sensors = ['sensor1', 'sensor2'];
			configInstance.readySensors(sensors);
			expect(configInstance.buildConfig().readySensors).toEqual(sensors);
		});

		it('should add prepend calls', function() {
			var someFn = function() { };
			configInstance.prepend(someFn);
			expect(configInstance.buildConfig().prepends).toEqual([someFn]);
		});

		it('should add append calls', function() {
			var someFn = function() { };
			configInstance.append(someFn);
			expect(configInstance.buildConfig().appends).toEqual([someFn]);
		});

		it('should add intercept calls', function() {
			var someFn = function() { };
			configInstance.intercept(someFn);
			expect(configInstance.buildConfig().intercepts).toEqual([someFn]);
		});

		it('should not change the configuration if sealed', function() {
			var error = "This configuration cannot be modified.";
			configInstance.sealed(true);
			try {
				configInstance.url("someUrl");
				throw new Error("expected an error");
			} catch (e) {
				expect(e.message).toBe(error);
			}
			try {
				configInstance.prepend(true);
				throw new Error("expected an error");
			} catch (e) {
				expect(e.message).toBe(error);
			}
		});
	});

	describe('config inheritance', function() {
		var configInstance, child;
		beforeEach(function() {
			configInstance = config.create();
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
		it('should merge array properties', function() {
			configInstance._data.someProp = [1];
			child._data.someProp = [2];
			expect(child.buildConfig().someProp).toEqual([1,2]);
		});

	});
});