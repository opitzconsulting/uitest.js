jasmineui.define('server/testAdapter', ['jasmine/original', 'jasmine/shared'], function (jasmineOriginal, jasmineShared) {
    var jasmine = jasmineOriginal.jasmine;

    var _execute = jasmineOriginal.jasmine.Runner.prototype.execute;

    instrumentSpecs();

    function interceptSpecRunner(runCallback) {
        var proto = jasmineOriginal.jasmine.Runner.prototype;
        proto.execute = function () {
            runCallback();
            _execute.apply(this, arguments);
        };
    }

    function instrumentSpecs() {
        var proto = jasmineOriginal.jasmine.Spec.prototype;
        var _execute = proto.execute;

        proto.execute = function(onComplete) {
            if (!this.uiSpec) {
                // still execute normal unit specs!
                return _execute.apply(this, arguments);
            }

            this.env.reporter.reportSpecStarting(this);
            this.env.currentSpec = this;

            if (!this.env.specFilter(this)) {
                this.results_.skipped = true;
                this.finish(onComplete);
                return;
            }

            var self = this;
            // always report one successful result, as the client only
            // reports errors and the spec reporter
            // displays specs with no results as filtered!
            this.addMatcherResult(new jasmine.ExpectationResult({
                passed:true
            }));

            this.deferredFinish = function () {
                self.finish.call(this, onComplete);
            };
            if (this.remoteSpecFinishedCalled) {
                this.deferredFinish();
            }
        };

        proto.remoteSpecFinished = function () {
            this.remoteSpecFinishedCalled = true;
            if (this.deferredFinish) {
                this.deferredFinish();
            }
        };
    }

    function reportSpecResults(spec) {
        var specId = spec.id;
        var localSpec = jasmineShared.findSpecById(specId);
        var i = 0;
        var result;
        for (i = 0; i < spec.results.length; i++) {
            result = spec.results[i];
            localSpec.addMatcherResult(new jasmine.ExpectationResult({
                passed:false,
                message:result.message,
                trace:{stack:result.stack}
            }));
        }

        localSpec.remoteSpecFinished();
    }

    function listSpecIds() {
        var i, spec,
            res = [],
            env = jasmineOriginal.jasmine.getEnv(),
            specs = env.currentRunner().specs();
        for (i=0; i<specs.length; i++) {
            spec = specs[i];
            res.push(jasmineShared.specId(spec));
        }
        return res;
    }

    function filterSpecs(specs) {
        var res = [],
            env=jasmineOriginal.jasmine.getEnv(),
            i, jasmineSpec;
        for (i=0; i<specs.length; i++) {
            jasmineSpec = jasmineShared.findSpecById(specs[i].id);
            if (env.specFilter(jasmineSpec)) {
                res.push(specs[i]);
                jasmineSpec.uiSpec = true;
            }
        }
        return res;
    }

    return {
        interceptSpecRunner:interceptSpecRunner,
        reportSpecResults:reportSpecResults,
        filterSpecs:filterSpecs,
        listSpecIds:listSpecIds
    };

});