describe('proxyFactory', function() {
    var factory;
    beforeEach(function() {
        factory = uitest.require(["proxyFactory"]).proxyFactory;
    });
    describe('function proxies', function() {
        var original, proxy, interceptFn;
        beforeEach(function() {
            original = {
                test: jasmine.createSpy('fn')
            };
            interceptFn = jasmine.createSpy('fnIntercept');
            proxy = factory(original, {
                fn: interceptFn
            });
        });
        it('should be able to return a new value', function() {
            var newValue = 'newValue';
            interceptFn.andReturn(newValue);
            expect(proxy.test()).toBe(newValue);
        });
        it('should get the old data as arguments', function() {
            var someArg = 'someArg';
            proxy.test(someArg);
            expect(interceptFn).toHaveBeenCalledWith({
                self: original,
                delegate: original.test,
                args: [someArg],
                name: 'test'
            });
        });
    });

    describe('property getters', function() {
        var original, proxy, interceptGet;
        beforeEach(function() {
            original = {
                test: null
            };
            interceptGet = jasmine.createSpy('interceptGet');
            proxy = factory(original, {
                get: interceptGet
            });
        });
        it('should be able to return a new value', function() {
            var newValue = 'newValue';
            interceptGet.andReturn(newValue);
            expect(proxy.test).toBe(newValue);
        });
        it('should get the old data as arguments', function() {
            var dummy = proxy.test;
            expect(interceptGet).toHaveBeenCalledWith({
                self: original,
                name: 'test'
            });
        });
    });

    describe('property setters', function() {
        var original, proxy, interceptSet;
        beforeEach(function() {
            original = {
                test: null
            };
            interceptSet = jasmine.createSpy('interceptSet');
            proxy = factory(original, {
                set: interceptSet
            });
        });
        it('should get the old data as arguments', function() {
            var newValue = 'newValue';
            proxy.test = newValue;
            expect(interceptSet).toHaveBeenCalledWith({
                self: original,
                name: 'test',
                value: newValue
            });
        });
    });
});
