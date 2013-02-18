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
});
