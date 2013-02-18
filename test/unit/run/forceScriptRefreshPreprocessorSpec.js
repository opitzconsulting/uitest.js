describe('run/forceScriptRefreshPreprocessor', function() {
    var preprocessor, instrumentor, config, utils;
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
        var modules = uitest.require({
            "run/config": config,
            "utils": utils,
            "run/instrumentor": instrumentor
        }, ["run/forceScriptRefreshPreprocessor"]);
        preprocessor = modules["run/forceScriptRefreshPreprocessor"];
    });

    it('should register itself at the instrumentor', function() {
        expect(instrumentor.addPreprocessor).toHaveBeenCalledWith(9999, preprocessor);
    });

    it('should add Date.now() to every script with a url', function() {
        var html = preprocessor('<script src="someUrl"></script>');
        expect(html).toBe('<script src="someUrl?123"></script>');
    });
    it('should not modify scripts without src', function() {
        var html = preprocessor('<script>some</script>');
        expect(html).toBe('<script>some</script>');
    });

});