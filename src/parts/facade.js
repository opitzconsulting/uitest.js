uitest.define('facade', ['urlLoader', 'ready', 'loadSensor', 'config'], function(urlLoader, readyModule, loadSensor, config) {
	var CONFIG_FUNCTIONS = ['parent','url','loadMode','readySensors',
        'append','prepend','intercept'];

	function create() {
		var res = {},
			i, fnName, configInstance;
		configInstance = res._config = config.create();
		for (i=0; i<CONFIG_FUNCTIONS.length; i++) {
			fnName = CONFIG_FUNCTIONS[i];
			res[fnName] = bind(configInstance[fnName], configInstance);
		}
		res.ready = ready;
		res.reloaded = reloaded;
		res.readyLatch = readyLatch;
		return res;
	}

	function bind(fn, target) {
		return function() {
			return fn.apply(target, arguments);
		};
	}

	function ready(callback) {
		var self = this;
		if(!this._runInstance) {
			this._config.sealed(true);
			var config = this._config.buildConfig();
			config.readySensors = config.readySensors || [];
			config.readySensors.push(loadSensor.sensorName);
			this._runInstance = {
				config: config,
				readySensorInstances: readyModule.createSensors(config)
			};
			urlLoader(this._runInstance);
			this.reloaded(callback);
		} else {
			return readyModule.ready(this._runInstance.readySensorInstances, callback);
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

	return {
		create: create
	};
});