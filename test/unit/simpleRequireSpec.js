describe('simpleRequire', function () {
    var oldModuleDefs;
    beforeEach(function () {
        uitest.require.cache = {};
        oldModuleDefs = uitest.define.moduleDefs;
        uitest.define.moduleDefs = [];
        document.documentElement.removeAttribute("data-uitest");
    });
    afterEach(function () {
        uitest.define.moduleDefs = oldModuleDefs;
    });

    describe('factory plugin', function () {
        it('should create accessor functions', function () {
            uitest.define('someModule', {});
            var someModuleFactory;
            uitest.require(['factory!someModule'], function (_someModuleFactory) {
                someModuleFactory = _someModuleFactory;
            });
            expect(typeof someModuleFactory).toBe('function');
        });
        it("should create a new module instance on each call of the factory function", function () {
            var counter = 0;
            uitest.define('someModule', function () {
                return counter++;
            });
            var someModuleFactory;
            uitest.require(['factory!someModule'], function (_someModuleFactory) {
                someModuleFactory = _someModuleFactory;
            });
            expect(someModuleFactory()).toBe(0);
            expect(someModuleFactory()).toBe(1);
        });
        it("should cache module instances using the given parameter", function () {
            var counter = 0;
            var cache = {};
            uitest.define('someModule', function () {
                return counter++;
            });
            var someModuleFactory;
            uitest.require(['factory!someModule'], function (_someModuleFactory) {
                someModuleFactory = _someModuleFactory;
            });
            expect(someModuleFactory(cache)).toBe(0);
            expect(someModuleFactory(cache)).toBe(0);
        });
        it("should use the modules from the given cache", function () {
            uitest.define('someModule', 'someOtherValue');
            var someModuleFactory;
            uitest.require(['factory!someModule'], function (_someModuleFactory) {
                someModuleFactory = _someModuleFactory;
            });
            var someValue = 'someValue';
            var cache = {someModule:someValue};
            expect(someModuleFactory(cache)).toBe(someValue);
        });
    });

    describe('require', function () {
        it('should cache created instances', function () {
            var counter = 0;
            uitest.define('someModule', function () {
                return counter++;
            });
            var actualValue1, actualValue2;
            uitest.require(['someModule'], function (someModule) {
                actualValue1 = someModule;
            });
            uitest.require(['someModule'], function (someModule) {
                actualValue2 = someModule;
            });
            expect(actualValue1).toBe(0);
            expect(actualValue2).toBe(0);
            expect(counter).toBe(1);
        });

        it('should create instances of fixed value modules', function () {
            var someValue = {};
            uitest.define('someModule', someValue);
            var actualValue;
            uitest.require(['someModule'], function (someModule) {
                actualValue = someModule;
            });
            expect(actualValue).toBe(someValue);
        });

        it('should create instances of modules with factory function', function () {
            var someValue = {};
            uitest.define('someModule', function () {
                return someValue;
            });
            var actualValue;
            uitest.require(['someModule'], function (someModule) {
                actualValue = someModule;
            });
            expect(actualValue).toBe(someValue);
        });

        it('should create dependent modules and inject them', function () {
            var someValue = {};
            uitest.define('someModule', function () {
                return someValue;
            });
            var actualValue;
            uitest.define('someModule2', ['someModule'], function (someModule) {
                actualValue = someModule;
            });
            uitest.require(['someModule2']);
            expect(actualValue).toBe(someValue);
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
    });
    describe('require.all', function () {
        it('should instantiate all modules matching the regex and return them', function () {
            var moduleA = 'a';
            var moduleB = 'b';
            uitest.define('a', function () {
                return moduleA;
            });
            uitest.define('b', function () {
                return moduleB;
            });
            var allModules;
            uitest.require.all(function (modules) {
                allModules = modules;
            }, function (name) {
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