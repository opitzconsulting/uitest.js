describe('run/forceScriptRefreshPreprocessor', function() {
    var preprocessor, instrumentor, config;
    beforeEach(function() {
        config = {
            now: 123
        };
        instrumentor = {
            addPreprocessor: jasmine.createSpy('addPreprocessor')
        };
        var modules = uitest.require({
            "run/config": config,
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