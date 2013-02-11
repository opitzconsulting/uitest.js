uitest.define('jasmineSugar', ['facade', 'global'], function(facade, global) {

    if (!global.jasmine) {
        return {};
    }

    function currentIdAccessor() {
        var ids = [],
            env = global.jasmine.getEnv(),
            spec = env.currentSpec,
            suite = env.currentSuite;
        // Note for the check of spec.queue.running: 
        // Jasmine leaves env.currentSpec filled even if outside
        // of any spec from the last run!
        if (spec && spec.queue.running) {
            ids.unshift(spec.id);
            suite = spec.suite;
        }
        while (suite) {
            ids.unshift(suite.id);
            suite = suite.parentSuite;
        }
        return ids.join(".");
    }

    facade.currentIdAccessor(currentIdAccessor);

    function runs(callback, timeout) {
        var ready = false;
        global.runs(function() {
            facade.current.ready(function() {
                ready = true;
            });
        });
        global.waitsFor(function() {
            return ready;
        }, "waiting for uitest.ready", timeout);
        global.runs(function() {
            facade.current.inject(callback);
        });
    }

    return {
        currentIdAccessor: currentIdAccessor,
        runs: runs,
        global: {
            uitest: {
                current: {
                    runs: runs
                }
            }
        }
    };
});