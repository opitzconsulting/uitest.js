(function(window) {
    var FRAME_NAME = 'testframe',
        frame,
        exports = {};

    afterEach(function() {
        if(frame) {
            frame.element.parentElement.removeChild(frame.element);
            frame = null;
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