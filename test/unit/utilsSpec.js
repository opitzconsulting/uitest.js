ddescribe('utils', function() {
    var utils;
    beforeEach(function() {
        utils = uitest.require({
        }, ["utils"]).utils;
    });
    describe('testRunTimestamp', function() {
        it('should return the same timestamp when the module is recreated', function() {
            var utils2 = uitest.require(["utils"]).utils;
            expect(utils.testRunTimestamp()).toBe(utils2.testRunTimestamp());

        });
    });
    describe('asyncLoop', function() {
        var loopDone;
        beforeEach(function() {
            loopDone = jasmine.createSpy('done');
        });
        it('should call the handler for every item', function() {
            var items = ['a','b'],
                receivedItems = [],
                receivedItemIndices = [];
            utils.asyncLoop(items, loopHandler, loopDone);
            expect(receivedItems).toEqual(items);
            expect(receivedItemIndices).toEqual([0,1]);

            function loopHandler(entry, done) {
                receivedItems.push(entry.item);
                receivedItemIndices.push(entry.index);
                done();
            }
        });
        it('should call the handlers asynchronously', function() {
            var items = ['a','b'],
                loopHandler = jasmine.createSpy('loopHandler');
            utils.asyncLoop(items, loopHandler, loopDone);
            expect(loopHandler.callCount).toBe(1);
            expect(loopDone).not.toHaveBeenCalled();
            loopHandler.mostRecentCall.args[1]();
            expect(loopHandler.callCount).toBe(2);
            expect(loopDone).not.toHaveBeenCalled();
            loopHandler.mostRecentCall.args[1]();
            expect(loopDone).toHaveBeenCalled();
        });
        it('should stop on an error and return it', function() {
            var items = ['a','b'],
                error = {},
                loopHandler = jasmine.createSpy('loopHandler');
            utils.asyncLoop(items, loopHandler, loopDone);
            loopHandler.mostRecentCall.args[1](error);
            expect(loopHandler.callCount).toBe(1);
            expect(loopDone).toHaveBeenCalledWith(error);
        });
        it('should stop when entry.stop is called', function() {
            var items = ['a','b'],
                error = {},
                loopHandler = jasmine.createSpy('loopHandler');
            utils.asyncLoop(items, loopHandler, loopDone);
            loopHandler.mostRecentCall.args[0].stop();
            expect(loopDone).not.toHaveBeenCalled();
            loopHandler.mostRecentCall.args[1]();
            expect(loopHandler.callCount).toBe(1);
            expect(loopDone).toHaveBeenCalled();
        });
        it('should not call synchronous handlers recursivly', function() {
            var reentryCount = 0,
                maxReentryCount = 0;

            utils.asyncLoop(['a','b'], loopHandler, loopDone);
            expect(loopDone).toHaveBeenCalled();
            expect(maxReentryCount).toBe(1);

            function loopHandler(entry, done) {
                reentryCount++;
                maxReentryCount = Math.max(maxReentryCount,reentryCount);
                done();
                reentryCount--;
            }
        });
    });
});
