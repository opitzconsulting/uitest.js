jasmineui.define('client/beforeLoad', ['persistentData', 'globals', 'instrumentor', 'client/loadUi'], function (persistentData, globals, instrumentor, loadUi) {
    var pd = persistentData();

    var remoteSpec = pd.specs[pd.specIndex];
    var beforeLoadCallbacks = [];

    function beforeLoad(callback) {
        beforeLoadCallbacks.push(callback);
    }

    instrumentor.endCall(function () {
        var i;
        for (i = 0; i < beforeLoadCallbacks.length; i++) {
            try {
                beforeLoadCallbacks[i]();
            } catch (e) {
                loadUi.reportError(e);
            }
        }
    });

    return {
        globals: {
            jasmineui: {
                beforeLoad: beforeLoad
            }
        }
    }
});
