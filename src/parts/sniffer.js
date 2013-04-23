uitest.define('sniffer', ['global'], function(global) {

    var browser = browserSniffer();
    return {
        browser: browser,
        history: !!global.history.pushState,
        // android has problems with internal caching when 
        // doing cors requests. So we need to do cache busting every time!
        // See http://opensourcehacker.com/2011/03/20/android-webkit-xhr-status-code-0-and-expires-headers/
        corsXhrForceCacheBusting: browser.android,
        // ff always returns false when calling dispatchEvent on links.
        // See https://bugzilla.mozilla.org/show_bug.cgi?id=684208:        
        dispatchEventDoesNotReturnPreventDefault: browser.ff,
        // In FF, we can't just juse an empty iframe and rewrite
        // it's content, as then the history api will throw errors
        // whenever history.pushState is used within the frame.
        // We need to do doc.open/write/close in the onload event
        // to prevent this problem!        
        documentWriteOnlyInOnload: browser.ff,
        // Firefox does not support javascript urls for rewriting documents:
        // it does not revert back to the previous url
        // Android does not set the location correctly when
        // using js urls and a pushState before.
        jsUrlWithPushState: !browser.ff && !browser.android
    };

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
});