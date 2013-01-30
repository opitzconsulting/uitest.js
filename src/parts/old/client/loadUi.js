jasmineui.define('client/loadUi', ['persistentData', 'globals', 'client/testAdapter', 'urlLoader', 'scriptAccessor', 'instrumentor', 'config', 'client/asyncSensor'], function (persistentData, globals, testAdapter, urlLoader, scriptAccessor, instrumentor, config, asyncSensor) {
    var pd = persistentData();

    function getOwnerLoadUiServer() {
        var owner = globals.opener || globals.parent;
        return owner && owner.jasmineui.loadUiServer;
    }

    var ownerLoadUiServer = getOwnerLoadUiServer();

    runCurrentSpec();

    function runCurrentSpec() {
        var remoteSpec = pd.specs[pd.specIndex];
        testAdapter.initSpecRun(remoteSpec);
        logSpecStatus(remoteSpec);
        addUtilScripts();
        instrumentor.beginScript(remoteSpec.testScript);
        asyncSensor.afterAsync(function () {
            testAdapter.executeSpecRun(function () {
                if (ownerLoadUiServer) {
                    ownerLoadUiServer.specFinished(remoteSpec);
                }
                runNextSpec();
            });
        });
    }

    function runNextSpec() {
        pd.specIndex = pd.specIndex + 1;
        var url;
        if (pd.specIndex < pd.specs.length) {
            url = pd.specs[pd.specIndex].url;
        } else {
            if (ownerLoadUiServer) {
                ownerLoadUiServer.runFinished();
            } else {
                url = pd.reporterUrl;
            }
        }
        if (url) {
            urlLoader.navigateWithReloadTo(globals, url);
        }
    }


    function addUtilScripts() {
        var i, script;
        // first add the configured scripts
        for (i = 0; i < config.scripts.length; i++) {
            script = config.scripts[i];
            if (script.position === 'begin') {
                instrumentor.beginScript(script.url);
            } else {
                instrumentor.endScript(script.url);
            }
        }
    }

    function logSpecStatus(remoteSpec) {
        if (!globals.console) {
            return;
        }

        var output = '[';
        for (var i = 0; i < pd.specs.length; i++) {
            var spec = pd.specs[i];
            var state = ' ';
            if (spec.results) {
                state = spec.results.failedCount > 0 ? 'F' : '.';
            }
            output += state;
        }
        output += ']';
        globals.console.log("Jasmineui: " + output + ": " + remoteSpec.id);
    }

    function loadUi(url, callback) {
        callback();
    }

    globals.addEventListener('error', function (event) {
        addErrorResult({
            message:event.message
        });
    }, false);

    function addErrorResult(errorResult) {
        var remoteSpec = pd.specs[pd.specIndex];
        remoteSpec.results.push(errorResult);
    }

    function reportError(e) {
        addErrorResult({
            message:e.toString(),
            stack:e.stack
        });
    }

    return {
        globals: {
            jasmineui: {
                loadUi: loadUi
            }
        },
        reportError:reportError
    };
});
