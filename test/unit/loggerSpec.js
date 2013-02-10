describe('logger', function() {
    var logger, global;
    beforeEach(function() {
        global = {
            console: {
                log: jasmine.createSpy('log')
            }
        };
        logger = uitest.require({
            global: global
        },["logger"]).logger;
    });
    describe('log', function() {
        it('should log to the console', function() {
            logger.log('someValue');
            expect(global.console.log).toHaveBeenCalledWith('someValue');
        });
    });

});

