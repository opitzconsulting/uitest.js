describe('run/feature/cacheBuster', function() {
    var cacheBuster, instrumentor, config, utils, someNow, requirejsScriptAdder;
    beforeEach(function() {
        config = {
        };
        someNow = 123;
        utils = {
            testRunTimestamp: jasmine.createSpy('testRunTimestamp').andReturn(someNow)
        };
        instrumentor = {
            addPreprocessor: jasmine.createSpy('addPreprocessor')
        };
        requirejsScriptAdder = {
            addLoadInterceptor: jasmine.createSpy('requirejsScriptAdder')
        };
        var modules = uitest.require({
            "run/config": config,
            "utils": utils,
            "run/instrumentor": instrumentor,
            "run/requirejsScriptAdder": requirejsScriptAdder
        }, ["run/feature/cacheBuster"]);
        cacheBuster = modules["run/feature/cacheBuster"];
    });

    describe('forceScriptRefresh', function() {
        it('should register itself at the instrumentor', function() {
            expect(instrumentor.addPreprocessor).toHaveBeenCalledWith(9999, cacheBuster.forceScriptRefresh);
        });
        it('should add Date.now() to every script with a url', function() {
            var html = cacheBuster.forceScriptRefresh('<script src="someUrl"></script>');
            expect(html).toBe('<script src="someUrl?123"></script>');
        });
        it('should not modify scripts without src', function() {
            var html = cacheBuster.forceScriptRefresh('<script>some</script>');
            expect(html).toBe('<script>some</script>');
        });
    });

    describe('forceScriptRefreshLoadInterceptor', function() {
        it('should register itself at the requirejsScriptAdder', function() {
            expect(requirejsScriptAdder.addLoadInterceptor).toHaveBeenCalledWith(9999, cacheBuster.forceScriptRefreshLoadInterceptor);
        });
        it('should return an url with a query param', function() {
            expect(cacheBuster.forceScriptRefreshLoadInterceptor('someUrl')).toBe('someUrl?123');
        });
    });

});