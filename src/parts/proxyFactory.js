uitest.define('proxyFactory', ['global'], function(global) {

    return createProxy;

    function createProxy(original, interceptors) {
        var propName, proxy;
        proxy = newProxyObject();
        for (propName in original) {
            if (typeof original[propName] === 'function') {
                addFunction(original, proxy, propName, interceptors.fn);
            } else {
                addProperty(original, proxy, propName, interceptors.get, interceptors.set);
            }
        }
        return proxy;
    }

    function newProxyObject() {
        try {
            addProperty({}, {}, 'test');
            return {};
        } catch (e) {
            // For IE 8: Getter/Setters only supported on DOM nodes...
            return global.document.createElement('div');
        }
    }

    function addFunction(original, proxy, propName, interceptor) {
        var oldFn = original[propName];
        return proxy[propName] = interceptedFn;

        function interceptedFn() {
            return interceptor({
                self: original,
                name: propName,
                args: arguments,
                delegate: oldFn
            });
        }
    }

    function addProperty(original, proxy, propName, getInterceptor, setInterceptor) {
        // Modern browsers, IE9+, and IE8 (must be a DOM object),
        if (Object.defineProperty) {
            Object.defineProperty(proxy, propName, {
                get: getFn,
                set: setFn
            });
            // Older Mozilla
        } else if (proxy.__defineGetter__) {
            proxy.__defineGetter__(propName, getFn);
            proxy.__defineSetter__(propName, setFn);
        } else {
            throw new Error("This browser does not support getters or setters!");
        }

        function getFn() {
            return getInterceptor({
                self: original,
                name: propName
            });
        }

        function setFn(value) {
            return setInterceptor({
                self: original,
                name: propName,
                value: value
            });
        }
    }
});