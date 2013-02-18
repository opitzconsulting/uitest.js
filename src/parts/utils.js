uitest.define('utils', ['global'], function(global) {
    var now = -1;
    if (global.Date) {
        now = global.Date.now();
    }

    function isString(obj) {
        return obj && obj.slice;
    }

    function isFunction(value) {
        return typeof value === 'function';
    }

    function isArray(value) {
        return global.Object.prototype.toString.apply(value) === '[object Array]';
    }

    function testRunTimestamp() {
        return now;
    }

    return {
        isString: isString,
        isFunction: isFunction,
        isArray: isArray,
        testRunTimestamp: testRunTimestamp
    };

});