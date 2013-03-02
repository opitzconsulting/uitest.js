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
        it('should log to the console if trace enabled', function() {
            runConfig.trace = true;
            logger.log('someValue');
            expect(global.console.log).toHaveBeenCalledWith('someValue');
        });
        it('should not log the same message twice', function() {
            runConfig.trace = true;
            logger.log('someValue');
            logger.log('someValue');
            expect(global.console.log.callCount).toBe(1);
        });
        it('should not log to the console if trace disabled', function() {
            runConfig.trace = false;
            logger.log('someValue');
            expect(global.console.log).not.toHaveBeenCalled();
        });
    });

});

