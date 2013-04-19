uitest.define('sniffer', ['global', 'documentUtils'], function(global, documentUtils) {

    return {
        browser: browserSniffer(),
        history: !!global.history.pushState
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