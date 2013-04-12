describe('utils', function() {
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
    describe('processAsyncEvent', function() {
        it('should be tested', function() {
            throw new Error("implemet me!");
        });
        /*
        it('should order the processors by their priorty', function() {
            var allTokens = [];
            processor1.priority = 0;
            processor2.priority = 1;

            function processor1(token, state, emitter) {
                emitter.emit(token);
                emitter.emit({type:'other', match:'1'});
                emitter.next();
            }
            function processor2(token, state, emitter) {
                emitter.emit(token);
                emitter.emit({type:'other', match:'2'});
                emitter.next();
            }
            parser.transform({
                input: 'a',
                processors: [processor1,processor2],
                done: resultCb
            });
            expect(result).toEqual('a121');
        });
        */
    });
});
