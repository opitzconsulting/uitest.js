uitest.define('documentUtils', ['global'], function(global) {
    return {
        evalScript: evalScript,
        addEventListener: addEventListener,
        removeEventListener: removeEventListener,
        textContent: textContent
    };

    function evalScript(win, scriptUrl, scriptContent) { /*jshint evil:true*/
        if (scriptUrl) {
            scriptContent += "//@ sourceURL=" + scriptUrl;
        }
        win["eval"].call(win, scriptContent);
    }

    function addEventListener(target, type, callback) {
        if (target.nodeName && target.nodeName.toLowerCase() === 'iframe' && type === 'load') {
            // Cross browser way for onload iframe handler
            if (target.attachEvent) {
                target.attachEvent('onload', callback);
            } else {
                target.onload = callback;
            }
        } else if (target.addEventListener) {
            target.addEventListener(type, callback, false);
        } else {
            target.attachEvent("on" + type, callback);
        }
    }

    function removeEventListener(target, type, callback) {
        if (target[type] === callback) {
            target[type] = null;
        }
        if (target.removeEventListener) {
            target.removeEventListener(type, callback, false);
        } else {
            target.detachEvent("on" + type, callback);
        }
    }

    function textContent(el, val) {
        if ("text" in el) {
            el.text = val;
        } else {
            if ("innerText" in el) {
                el.innerHTML = val;
            } else {
                el.textContent = val;
            }
        }
    }

});