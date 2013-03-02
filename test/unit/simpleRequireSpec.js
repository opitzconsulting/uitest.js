describe('simpleRequire', function () {
    beforeEach(function () {
        uitest.define.moduleDefs = [];
    });

    describe('require', function () {
        it('should create new module instances if no cache is provided', function() {
            var counter = 0;
            uitest.define('someModule', function () {
                return counter++;
            });
            expect(uitest.require(['someModule']).someModule).toBe(0);
            expect(uitest.require(['someModule']).someModule).toBe(1);
        });
        it('should allow to use a callback for the required modules', function() {
            var someValue = 'someValue';
            uitest.define('someModule', someValue);
            var actualValue;
            uitest.require(['someModule'], function(someModule) {
                actualValue = someModule;
            });
            expect(actualValue).toBe(someValue);
        });

        it('should cache created instances', function () {
            var counter = 0,
                moduleCache = {};
            uitest.define('someModule', function () {
                return counter++;
            });
            var someCache = uitest.require(moduleCache, ['someModule']);
            expect(someCache).toBe(moduleCache);
            expect(moduleCache.someModule).toBe(0);
            expect(uitest.require(moduleCache, ['someModule']).someModule).toBe(0);
        });

        it('should inject the cache under the key "moduleCache"', function() {
            uitest.define('someModule', ["moduleCache"], function(moduleCache) { return moduleCache; });
            var someCache = uitest.require(['someModule']);
            expect(someCache).toBe(someCache.someModule);
        });

        it('should create instances of fixed value modules', function () {
            var someValue = {};
            uitest.define('someModule', someValue);
            expect(uitest.require(['someModule']).someModule).toBe(someValue);
        });

        it('should create instances of modules with factory function', function () {
            var someValue = {};
            uitest.define('someModule', function () {
                return someValue;
            });
            expect(uitest.require(['someModule']).someModule).toBe(someValue);
        });

        it('should create dependent modules and inject them', function () {
            var someValue = {};
            uitest.define('someModule', function () {
                return someValue;
            });
            var actualValue;
            uitest.define('someModule2', ['someModule'], function (someModule) {
                return someModule;
            });
            expect(uitest.require(['someModule2']).someModule2).toBe(someValue);
        });

        it('should merge objects under the "global" key into the global module', function () {
            var global = {};
            uitest.define('global', function () {
                return global;
            });
            uitest.define('a', function () {
                return {global:{a:'a0'}};
            });
            uitest.define('b', function () {
                return {global:{b:'b0', c:{c0:'c0'}}};
            });
            uitest.define('c', function () {
                return {global:{c:{c1:'c1'}}};
            });
            uitest.require(['a', 'b', 'c']);
            expect(global.a).toBe('a0');
            expect(global.b).toBe('b0');
            expect(global.c.c0).toBe('c0');
            expect(global.c.c1).toBe('c1');
        });

        it('should calculate the dependent modules using a given filter callback', function() {
            var moduleA = 'a';
            var moduleB = 'b';
            uitest.define('a', function () {
                return moduleA;
            });
            uitest.define('b', function () {
                return moduleB;
            });
            var allModules = uitest.require(function (name) {
                return name === 'a';
            });
            var moduleCount = 0;
            for (var x in allModules) {
                moduleCount++;
            }
            expect(moduleCount).toBe(1);
            expect(allModules.a).toBe(moduleA);
        });
    });
});