jasmineui.define('client/testAdapter', ['jasmine/original', 'jasmine/shared', 'globals'], function (jasmineOriginal, jasmineShared, globals) {
    var describeImpl = jasmineOriginal.describe;

    var executeSpecImpl = function () {
        throw new Error('initSpecRun must be called first!');
    };

    function initSpecRun(spec) {
        ignoreDescribesThatDoNotMatchTheSpecId(spec.id);
        executeSpecImpl = function(finishedCallback) {
            return executeSpec(spec, finishedCallback);
        };
    }

    function ignoreDescribesThatDoNotMatchTheSpecId(specId) {
        var currentSuiteId = '';
        describeImpl = function (name) {
            var oldSuiteId = currentSuiteId;
            if (currentSuiteId) {
                currentSuiteId += '#';
            }
            currentSuiteId += name;
            try {
                if (specId.indexOf(currentSuiteId) === 0) {
                    return jasmineOriginal.describe.apply(this, arguments);
                }
            } finally {
                currentSuiteId = oldSuiteId;
            }
        };
    }

    function executeSpec(remoteSpec, finishedCallback) {
        var spec = jasmineShared.findSpecById(remoteSpec.id);
        var specResults = spec.results_;
        var _addResult = specResults.addResult;
        specResults.addResult = function (result) {
            if (!result.passed()) {
                remoteSpec.results.push({
                    message:result.message,
                    // Convert the contained error to normal serializable objects to preserve
                    // the line number information!
                    stack:result.trace ? result.trace.stack : null
                });
            }
            return _addResult.apply(this, arguments);
        };
        spec.execute(finishedCallback);
    }

    return {
        globals:{
            describe:function() {
                return describeImpl.apply(this, arguments);
            }
        },
        initSpecRun:initSpecRun,
        executeSpecRun:function() {
            return executeSpecImpl.apply(this, arguments);
        }
    };
});


