jasmineui.define('jasmine/original', ['globals'], function (globals) {

    /**
     * Save the original values, as we are overwriting them in some modules
     */
    return {
        it:globals.it,
        describe:globals.describe,
        beforeEach:globals.beforeEach,
        afterEach:globals.afterEach,
        runs:globals.runs,
        waitsFor:globals.waitsFor,
        waits:globals.waits,
        jasmine:globals.jasmine,
        expect:globals.expect
    };
});