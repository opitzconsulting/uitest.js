jasmineui.define('client/simulateEvent', ['globals'], function (globals) {
    /**
     * Functions to simulate events.
     * Based upon https://github.com/jquery/jquery-ui/blob/master/tests/jquery.simulate.js
     * Can also handle elements from different frames.
     * <p>
     * Provides:
     * simulate(el, type, options)
     */
    function simulate(el, type, options) {
        options = extend({}, simulate.defaults, options || {});
        var document = el.ownerDocument;
        simulateEvent(document, el, type, options);
    }

    function extend(target) {
        for (var i = 1; i < arguments.length; i++) {
            var obj = arguments[i];
            for (var key in obj) {
                target[key] = obj[key];
            }
        }
        return target;
    }

    function simulateEvent(document, el, type, options) {
        var evt = createEvent(document, type, options);
        dispatchEvent(el, type, evt);
        return evt;
    }

    function createEvent(document, type, options) {
        if (/^mouse(over|out|down|up|move)|(dbl)?click$/.test(type)) {
            return mouseEvent(document, type, options);
        } else if (/^key(up|down|press)$/.test(type)) {
            return keyboardEvent(document, type, options);
        } else {
            return otherEvent(document, type, options);
        }
    }

    function mouseEvent(document, type, options) {
        var evt;
        var e = extend({
            bubbles:true, cancelable:(type != "mousemove"), detail:0,
            screenX:0, screenY:0, clientX:0, clientY:0,
            ctrlKey:false, altKey:false, shiftKey:false, metaKey:false,
            button:0, relatedTarget:undefined
        }, options);

        var relatedTarget = e.relatedTarget;

        if (typeof document.createEvent == 'function') {
            evt = document.createEvent("MouseEvents");
            evt.initMouseEvent(type, e.bubbles, e.cancelable, e.view, e.detail,
                e.screenX, e.screenY, e.clientX, e.clientY,
                e.ctrlKey, e.altKey, e.shiftKey, e.metaKey,
                e.button, e.relatedTarget || document.body.parentNode);
        } else if (document.createEventObject) {
            evt = document.createEventObject();
            extend(evt, e);
            evt.button = { 0:1, 1:4, 2:2 }[evt.button] || evt.button;
        }
        return evt;
    }

    function keyboardEvent(document, type, options) {
        var evt;

        var e = extend({ bubbles:true, cancelable:true,
            ctrlKey:false, altKey:false, shiftKey:false, metaKey:false,
            keyCode:0, charCode:0
        }, options);

        if (typeof document.createEvent == 'function') {
            try {
                evt = document.createEvent("KeyEvents");
                evt.initKeyEvent(type, e.bubbles, e.cancelable, e.view,
                    e.ctrlKey, e.altKey, e.shiftKey, e.metaKey,
                    e.keyCode, e.charCode);
            } catch (err) {
                evt = document.createEvent("Events");
                evt.initEvent(type, e.bubbles, e.cancelable);
                extend(evt, { view:e.view,
                    ctrlKey:e.ctrlKey, altKey:e.altKey, shiftKey:e.shiftKey, metaKey:e.metaKey,
                    keyCode:e.keyCode, charCode:e.charCode
                });
            }
        } else if (document.createEventObject) {
            evt = document.createEventObject();
            extend(evt, e);
        }
        return evt;
    }

    function otherEvent(document, type, options) {
        var evt;

        var e = extend({ bubbles:true, cancelable:true
        }, options);

        if (typeof document.createEvent == 'function') {
            evt = document.createEvent("Events");
            evt.initEvent(type, e.bubbles, e.cancelable);
        } else if (document.createEventObject) {
            evt = document.createEventObject();
            extend(evt, e);
        }
        return evt;
    }

    function dispatchEvent(el, type, evt) {
        if (el.dispatchEvent) {
            el.dispatchEvent(evt);
        } else if (el.fireEvent) {
            el.fireEvent('on' + type, evt);
        }
        return evt;
    }

    extend(simulate, {
        defaults:{
            speed:'sync',
            view:window
        },
        VK_TAB:9,
        VK_ENTER:13,
        VK_ESC:27,
        VK_PGUP:33,
        VK_PGDN:34,
        VK_END:35,
        VK_HOME:36,
        VK_LEFT:37,
        VK_UP:38,
        VK_RIGHT:39,
        VK_DOWN:40
    });

    return {
        globals: {
            jasmineui: {
                simulate: simulate
            }
        }
    };

});