uitest.define('sniffer', ['global'], function(global) {

    function jsUrlDoesNotChangeLocation(callback) {
        /*jshint scripturl:true*/
        var tmpFrame = global.top.document.createElement("iframe");
        global.top.document.body.appendChild(tmpFrame);
        // Opening and closing applies the
        // location href from the top window to the iframe.
        tmpFrame.contentWindow.document.open();
        tmpFrame.contentWindow.document.close();
        if (tmpFrame.attachEvent) {
            tmpFrame.attachEvent("onload", onloadCallback);
        } else {
            tmpFrame.onload = onloadCallback;
        }
        tmpFrame.contentWindow.location.href="javascript:'<html></html>'";

        function onloadCallback(){
            var result = tmpFrame.contentWindow.location.href.indexOf('javascript:')===-1;
            tmpFrame.parentNode.removeChild(tmpFrame);
            callback(result);
        }
    }

    function browserSniffer() {
        var useragent = global.navigator.userAgent.toLowerCase(),
            android = /android/i.test(useragent),
            ieMatch = /MSIE\s+(\d+)/i.exec(useragent),
            ff = /firefox/i.test(useragent);

        return {
            android: android,
            ie: ieMatch && parseInt(ieMatch[1],10),
            ff: ff
        };
    }


    function detectFeatures(readyCallback) {
        jsUrlDoesNotChangeLocation(function(jsUrlSupported) {
            readyCallback({
                jsUrl: jsUrlSupported,
                browser: browserSniffer()
            });
        });
    }

    return detectFeatures;
});