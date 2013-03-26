uitest.define('top', ['global'], function(global) {
    try {
        var res = global.top;
        // This read access should throw an exception if
        // we are on different domains...
        var domain = res.document.getElementsByTagName("html");
        return res;
    } catch (e) {
        return global;
    }
});
