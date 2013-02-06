uitest.require(["factory!logger"], function (loggerFactory) {
    describe('logger', function() {
        var logger, global;
        beforeEach(function() {
            global = {
                console: {
                    log: jasmine.createSpy('log')
                }
            };
            logger = loggerFactory({
                global: global
            });
        });
        describe('log', function() {
            it('should log to the console', function() {
                logger.log('someValue');
                expect(global.console.log).toHaveBeenCalledWith('someValue');
            });
        });

    });
});
