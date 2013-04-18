uitest.define('sniffer', ['global', 'documentUtils'], function(global, documentUtils) {

    // This is especially for FF, as it does not revert back
    // to the previous url when using a js url.
    function jsUrlDoesNotChangeLocation(callback) {
        var tmpFrame = global.document.createElement("iframe");
        global.document.body.appendChild(tmpFrame);
        // Opening and closing applies the
        // location href from the parent window to the iframe.
        tmpFrame.contentWindow.document.open();
        tmpFrame.contentWindow.document.close();
        // The timeout is needed as FF triggers the onload
        // from the previous document.open/close
        // even if we set the onload AFTER we did document.open/close!
        global.setTimeout(changeHrefAndAddOnLoad, 0);

        function changeHrefAndAddOnLoad() {
            /*jshint scripturl:true*/
            documentUtils.addEventListener(tmpFrame, "load", onloadCallback);
            tmpFrame.contentWindow.location.href="javascript:'<html><body>Hello</body></html>'";
        }

        function onloadCallback(){
            /*jshint scripturl:true*/
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
                browser: browserSniffer(),
                history: !!global.history.pushState
            });
        });
    }

    return detectFeatures;
});