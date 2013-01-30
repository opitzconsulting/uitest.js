jasmineui.define('server/loadUi', ['config', 'persistentData', 'scriptAccessor', 'globals', 'server/testAdapter', 'urlLoader', 'urlParser'], function (config, persistentData, scriptAccessor, globals, testAdapter, urlLoader, urlParser) {

    var executionData = {
        specs: []
    };

    start();

    function start() {
        var pd = persistentData();
        if (config.loadMode === 'inplace') {
            if (pd.specs) {
                runInplaceResultsPhase();
            } else {
                runInplaceStartPhase();
            }
        } else {
            setPopupMode();
        }
    }

    function loadUi(url, callback) {
        var scriptUrl = scriptAccessor.currentScriptUrl(),
            specs = executionData.specs,
            oldSpecIds = testAdapter.listSpecIds(),
            oldSpecIdHash = {},
            i, newSpecIds, specId;
        for (i=0; i<oldSpecIds.length; i++) {
            oldSpecIdHash[oldSpecIds[i]] = true;
        }
        callback();
        newSpecIds = testAdapter.listSpecIds();
        for (i = 0; i < newSpecIds.length; i++) {
            specId = newSpecIds[i];
            if (!oldSpecIdHash[specId]) {
                specs.push({
                    testScript:scriptUrl,
                    url:url,
                    id:specId,
                    results:[]
                });
            }
        }
    }

    function runInplaceStartPhase() {
        testAdapter.interceptSpecRunner(function () {
            var firstUrl = prepareExecution();
            if (!firstUrl) {
                return;
            }
            persistentData().reporterUrl = globals.location.href;
            urlLoader.navigateWithReloadTo(globals, firstUrl);
        });
    }

    function runInplaceResultsPhase() {
        var pd = persistentData();
        testAdapter.interceptSpecRunner(function () {
            var i, spec;
            for (i = 0; i < pd.specs.length; i++) {
                spec = pd.specs[i];
                testAdapter.reportSpecResults(spec);
            }
        });
    }

    function setPopupMode() {
        testAdapter.interceptSpecRunner(function () {
            // Now execute the ui specs
            var firstUrl = prepareExecution();
            if (!firstUrl) {
                return;
            }
            urlLoader.openTestWindow(firstUrl);
            globals.jasmineui.loadUiServer = {
                specFinished:function (spec) {
                    testAdapter.reportSpecResults(spec);
                },
                runFinished:function () {
                    urlLoader.closeTestWindow();
                }
            };
        });
    }

    function prepareExecution() {
        var pd = persistentData();
        // Filter the specIds just right before the specs should be run,
        // so the a spec filter has a chance to initialize itself.
        pd.specs = testAdapter.filterSpecs(executionData.specs);
        if (pd.specs.length===0) {
            return null;
        }
        pd.specIndex = 0;
        return pd.specs[0].url;
    }

    function beforeLoad() {
        // Noop in analyze phase
    }

    return {
        globals:{
            jasmineui:{
                loadUi:loadUi,
                beforeLoad:beforeLoad
            }
        }
    };
});