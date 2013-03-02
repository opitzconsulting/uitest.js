describe('run/injector', function() {
	var injector;

	beforeEach(function() {
		injector = uitest.require(["run/injector"])["run/injector"];
	});

	describe('inject', function() {
		it('should call the function with the given this pointer', function() {
			var self;
			var someFn = function() { self = this; };
			var expectedSelf = {};
			injector.inject(someFn, expectedSelf);
			expect(self).toBe(expectedSelf);
		});
		it('should inject values using parameter names', function() {
			var args;
			var someFn = function(arg1) { args = arguments; };
			injector.inject(someFn, null, [{
				arg1: 'someValue'
			}]);
			expect(args).toEqual(['someValue']);
		});
		it('should inject values if the function is an array', function() {
			var args;
			var someFn = function() { args = arguments; };
			injector.inject(['arg1', someFn], null, [{
				arg1: 'someValue'
			}]);
			expect(args).toEqual(['someValue']);
		});
		it('should inject values if the function has a $inject property', function() {
			var args;
			var someFn = function() { args = arguments; };
			someFn.$inject = ['arg1'];
			injector.inject(someFn, null, [{
				arg1: 'someValue'
			}]);
			expect(args).toEqual(['someValue']);
		});
		it('should search for a value to inject in the given values', function() {
			var args;
			var someFn = function(arg1) { args = arguments; };
			injector.inject(someFn, null, [{}, {
				arg1: 'someValue'
			}]);
			expect(args).toEqual(['someValue']);
		});
		it('should search for a value using the given resolver functions', function() {
			var args;
			var someFn = function(arg1) { args = arguments; };
			var resolver = jasmine.createSpy('resolver').andReturn('someValue');
			injector.inject(someFn, null, [resolver]);
			expect(resolver).toHaveBeenCalledWith("arg1");
			expect(args).toEqual(['someValue']);
		});
		it('should search for values in the default resolvers', function() {
			var args;
			var resolver = jasmine.createSpy('resolver').andReturn('someValue');
			injector.addDefaultResolver(resolver);
			var someFn = function(arg1) { args = arguments; };
			injector.inject(someFn, null, []);
			expect(resolver).toHaveBeenCalledWith("arg1");
			expect(args).toEqual(['someValue']);
		});
	});
});
