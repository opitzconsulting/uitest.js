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
        var win = window.frames[FRAME_NAME];
        exports.frame = {
            win: win,
            element: element
        };
        win.document.open();
        win.document.write(someHtml);
        win.document.close();
        return exports.frame;
    }

    exports = {
        createFrame: createFrame
    };
    window.testutils = exports;
})(window);