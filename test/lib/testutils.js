(function(window) {
    var oldModuleDefs;
    beforeEach(function () {
        oldModuleDefs = uitest.define.moduleDefs;
    });
    afterEach(function () {
        uitest.define.moduleDefs = oldModuleDefs;
    });

    var FRAME_NAME = 'testframe',
        exports = {};

    afterEach(function() {
        if(exports.frame) {
            exports.frame.element.parentElement.removeChild(exports.frame.element);
            exports.frame = null;
        }
    });

    function createFrame(someHtml) {
        var element = document.createElement('iframe');
        element.name = FRAME_NAME;
        document.body.appendChild(element);
        var win = element.contentWindow || element.contentDocument;
        exports.frame = {
            win: win,
            element: element
        };
        win.document.open();
        win.document.write(someHtml);
        win.document.close();
        return exports.frame;
    }

    function browserSniffer() {
        var useragent = window.navigator.userAgent.toLowerCase(),
            android = /android/i.test(useragent),
            ieMatch = /MSIE\s+(\d+)/i.exec(useragent),
            ff = /firefox/i.test(useragent);

        return {
            android: android,
            ie: ieMatch && parseInt(ieMatch[1],10),
            ff: ff
        };

    }

    exports = {
        createFrame: createFrame,
        browser: browserSniffer()
    };
    window.testutils = exports;
})(window);