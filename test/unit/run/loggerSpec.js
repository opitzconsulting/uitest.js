describe('run/logger', function() {
    var logger, global, runConfig;
    beforeEach(function() {
        global = {
            console: {
                log: jasmine.createSpy('log')
            }
        };
        runConfig = {};
        logger = uitest.require({
            global: global,
            "run/config": runConfig
        },["run/logger"])["run/logger"];
    });
    
    describe('log', function() {
        it('should log to the console if enabled', function() {
            runConfig.logging = true;
            logger.log('someValue');
            expect(global.console.log).toHaveBeenCalledWith('someValue');
        });
        it('should not log to the console if disabled', function() {
            runConfig.logging = false;
            logger.log('someValue');
            expect(global.console.log).not.toHaveBeenCalled();
        });
    });

});

