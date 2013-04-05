uitest.define('top', ['global'], function(global) {
    try {
        var res = global.top;
        // This read access should throw an exception if
        // we are on different domains...
        // If the top document contains a frameset, we don't have a body
        // so we stay to our frame window...
        var bodies = res.document.getElementsByTagName("body");
        if (bodies.length === 0) {
            return global;
        }
        return res;
    } catch (e) {
        return global;
    }
});
