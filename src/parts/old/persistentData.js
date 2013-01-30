jasmineui.define('persistentData', ['globals', 'instrumentor'], function (globals, instrumentor) {

    function getOwnerData() {
        var owner = globals.opener || globals.parent;
        return  owner && owner.jasmineui && owner.jasmineui.persistent;
    }

    var ownerData = getOwnerData();


    function get() {
        var win = globals;
        var res = win.jasmineui && win.jasmineui.persistent;
        if (!res) {
            win.jasmineui = win.jasmineui || {};
            if (ownerData) {
                win.jasmineui.persistent = ownerData;
                res = ownerData;
            } else {
                try {
                    res = win.jasmineui.persistent = JSON.parse(win.sessionStorage.jasmineui_data || '{}');
                } finally {
                    delete win.sessionStorage.jasmineui_data;
                }
            }
        }
        return res;
    }

    function setSessionStorage(target, property, value) {
        if (target === globals) {
            target.sessionStorage[property] = value;
        } else {
            // Note: in IE9 we cannot access target.sessionStorage directly,
            // so we need to use eval to set it :-(
            target.tmp = value;
            target.eval("sessionStorage." + property + " = window.tmp;");
        }
    }

    function saveDataToWindow(target) {
        var loaderString = instrumentor.loaderScript();
        setSessionStorage(target, "jasmineui", loaderString);
        if (!ownerData) {
            var dataString = JSON.stringify(get());
            setSessionStorage(target, "jasmineui_data", dataString);
        }
    }

    get.saveDataToWindow = saveDataToWindow;

    return get;
});