uitest.define('facade', ['urlLoader', 'ready', 'loadSensor', 'config', 'injector', 'instrumentor', 'global'], function(urlLoader, readyModule, loadSensor, config, injector, instrumentor, global) {
    var CONFIG_FUNCTIONS = ['parent', 'url', 'loadMode', 'readySensors', 'append', 'prepend', 'intercept'];

    function create() {
        var res = {
            ready: ready,
            realoded: reloaded,
            readyLatch: readyLatch,
            reloaded: reloaded,
            inject: inject
        },
            i, fnName, configInstance;
        configInstance = res._config = config.create();
        for(i = 0; i < CONFIG_FUNCTIONS.length; i++) {
            fnName = CONFIG_FUNCTIONS[i];
            res[fnName] = delegate(configInstance[fnName], configAccessor);
        }
        return res;

        function configAccessor(uit) {
            return uit && uit._config;
        }
    }

    function cleanup() {
        urlLoader.close();
    }

    function delegate(fn, targetAccessor) {
        return function() {
            var i,
                args = Array.prototype.slice.call(arguments),
                target = targetAccessor(this),
                otherTarget;
            for (i=0; i<args.length; i++) {
                otherTarget = targetAccessor(args[i]);
                if (otherTarget) {
                    args[i] = otherTarget;
                }
            }
            var res = fn.apply(target, args);
            if(res === target) {
                res = this;
            }
            return res;
        };
    }

    function ready(callback) {
        var self = this;
        if(!this._runInstance) {
            this._config.sealed(true);
            var config = this._config.buildConfig();
            config.readySensors = config.readySensors || [];
            config.readySensors.push(loadSensor.sensorName);
            instrumentor.init(config);
            this._runInstance = {
                config: config,
                readySensorInstances: readyModule.createSensors(config),
                frame: urlLoader.open(config)
            };

        }
        return readyModule.ready(this._runInstance.readySensorInstances, injectedCallback);

        function injectedCallback() {
            var frame = self._runInstance.frame;
            return injector.inject(callback, frame, [frame]);
        }
    }

    function readyLatch() {
        var result, self = this;
        return latch;

        function latch() {
            if(result === undefined) {
                result = 0;
                self.ready(function() {
                    result = 1;
                });
            }
            return result;
        }
    }

    function reloaded(callback) {
        loadSensor.waitForReload(this._runInstance.readySensorInstances);
        this.ready(callback);
    }

    function inject(callback) {
        if(!this._runInstance) {
            throw new Error("The test page has not yet loaded. Please call ready first");
        }
        var frame = this._runInstance.frame;
        return injector.inject(callback, frame, [frame]);
    }


    return {
        create: create,
        cleanup: cleanup,
        global: {
            uitest: {
                create: create,
                cleanup: cleanup
            }
        }
    };
});