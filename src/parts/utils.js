uitest.define('utils', ['global'], function(global) {
    function isString(obj) {
        return obj && obj.slice;
    }

    function isFunction(value) {
        return typeof value === 'function';
    }

    function isArray(value) {
        return global.Object.prototype.toString.apply(value) === '[object Array]';
    }

    return {
        isString: isString,
        isFunction: isFunction,
        isArray: isArray

    };

});