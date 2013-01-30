jasmineui.define('client/jasmine/multiLoad', ['jasmine/original', 'persistentData', 'jasmine/client/waitsForAsync', 'globals'], function (jasmineOriginal, persistentData, waitsForAsync, globals) {
    var pd = persistentData();

    if (pd.specIndex === -1) {
        return;
    }

    var remoteSpec = pd.specs[pd.specIndex];
    remoteSpec.lastRunsIndex = remoteSpec.lastRunsIndex || 0;

    var skipRunsCounter = remoteSpec.lastRunsIndex;
    var reloadHappened = false;

    globals.addEventListener('beforeunload', function () {
        // Note: on iOS beforeunload is NOT supported.
        // In that case we rely on the fact, that timeouts no more executed
        // when a navigation change occurs. And we do wait some milliseconds between
        // every two runs statements using waitsForAsync.
        // On all other browsers, we use this flag to stop test execution.
        reloadHappened = true;
    });

    function runs(callback) {
        if (skipRunsCounter === 0) {
            waitsForAsync.runs(function () {
                if (reloadHappened) {
                    createInfiniteWaitsBlock(jasmineOriginal.jasmine.getEnv().currentSpec);
                } else {
                    callback();
                    // save the current state of the specs. Needed for specs that contain multiple reloads.
                    // As beforeunload does not work in iOS :-(
                    remoteSpec.lastRunsIndex++;
                    persistentData.saveDataToWindow(globals.window);
                }
            });
        } else {
            skipRunsCounter--;
        }
    }

    function waitsFor(callback) {
        if (skipRunsCounter === 0) {
            jasmineOriginal.waitsFor.apply(this, arguments);
        }
    }

    function waits(callback) {
        if (skipRunsCounter === 0) {
            jasmineOriginal.waits.apply(this, arguments);
        }
    }

    jasmineOriginal.afterEach(function () {
        waitsForAsync.runs(function () {
            if (reloadHappened) {
                createInfiniteWaitsBlock(jasmineOriginal.jasmine.getEnv().currentSpec);
            }
        });
    });

    function createInfiniteWaitsBlock(spec) {
        var res = {
            env:spec.env,
            spec:spec,
            execute:function (onComplete) {
                res.onComplete = onComplete;
            }
        };
        spec.addToQueue(res);
        return res;
    }

    return {
        globals: {
            waits:waits,
            waitsFor:waitsFor,
            runs:runs
        }
    }
});
