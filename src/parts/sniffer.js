uitest.define('sniffer', ['global'], function(global) {

    function jsUrlDoesNotChangeLocation(callback) {
        /*jshint scripturl:true*/
        var tmpFrame = global.top.document.createElement("iframe");
        global.top.document.body.appendChild(tmpFrame);
        // Opening and closing applies the
        // location href from the top window to the iframe.
        tmpFrame.contentWindow.document.open();
        tmpFrame.contentWindow.document.close();
        tmpFrame.onload = function() {
            var result = tmpFrame.contentWindow.location.href.indexOf('javascript:')===-1;
            tmpFrame.parentNode.removeChild(tmpFrame);
            callback(result);
        };
        tmpFrame.contentWindow.location.href="javascript:'<html></html>'";
    }

    function detectFeatures(readyCallback) {
        jsUrlDoesNotChangeLocation(function(jsUrlSupported) {
            readyCallback({jsUrl: jsUrlSupported});
        });
    }

    return detectFeatures;
});