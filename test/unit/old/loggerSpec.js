jasmineui.require(['factory!logger'], function (loggerFactory) {
    describe('logger', function () {
        var logger, console, config;
        beforeEach(function () {
            console = {
                log: jasmine.createSpy('console')
            };
            config = {
                logEnabled: true
            };
            logger = loggerFactory({
                'globals': {
                    console: console
                },
                config: config
            });
        });
        it('should log to the console if enabled', function () {
            config.logEnabled = true;
            logger.log("hello");
            expect(console.log).toHaveBeenCalledWith("hello");
        });

        it('should log multiple arguments to the console if enabled', function () {
            config.logEnabled = true;
            logger.log("hello", 2);
            expect(console.log).toHaveBeenCalledWith("hello", 2);
        });

        it('should not log to the console if disabled', function () {
            config.logEnabled = false;
            logger.log("hello");
            expect(console.log).not.toHaveBeenCalled();
        })
    });
});
