describe('utils', function() {
    var utils,testframe,global,evalSpy;
    beforeEach(function() {
        /*jshint evil:true*/
        evalSpy = jasmine.createSpy("eval");
        global = {
            "eval": evalSpy,
            Object: window.Object
        };
        utils = uitest.require({
            global: global
        }, ["utils"]).utils;
        testframe = testutils.createFrame('<html></html>').win;
    });
    describe('isString', function() {
        it('works as expected', function() {
            expect(utils.isString('asdf')).toBe(true);
            expect(utils.isString({})).toBe(false);
            expect(utils.isString([])).toBe(false);
        });
        it('works cross frame', function() {
            expect(utils.isString(new testframe.String())).toBe(true);
        });
    });
    describe('isFunction', function() {
        it('works as expected', function() {
            expect(utils.isFunction(function(){})).toBe(true);
            expect(utils.isFunction({})).toBe(false);
        });
        it('works cross frame', function() {
            expect(utils.isFunction(testframe.location.reload)).toBe(true);
        });
    });
    describe('isArray', function() {
        it('works as expected', function() {
            expect(utils.isArray([])).toBe(true);
            expect(utils.isArray({})).toBe(false);
        });
        it('works cross frame', function() {
            expect(utils.isArray(new testframe.Array())).toBe(true);
        });
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
    describe('orderByPriority', function() {
        it('should order by prio', function() {
            var entries = [{id:1},{id:2, priority:-1},{id:3, priority:1}];
            utils.orderByPriority(entries);
            expect(entries).toEqual([{id:3, priority:1},{id:1},{id:2, priority:-1}]);
        });
        it('should keep the order for entries with the same prio', function() {
            var entries = [{id:1},{id:2},{id:3, priority:0}];
            utils.orderByPriority(entries);
            expect(entries).toEqual([{id:1},{id:2},{id:3, priority:0}]);
        });
    });
    describe('evalScript', function() {
        it('calls win.eval adding the script source if available', function() {
            utils.evalScript(global, 'someUrl', 'someContent');
            expect(evalSpy).toHaveBeenCalledWith('someContent//@ sourceURL=someUrl');
            utils.evalScript(global, '', 'someContent');
            expect(evalSpy).toHaveBeenCalledWith('someContent');
        });
    });
});
