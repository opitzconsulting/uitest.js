uitest.define('ready', ['logger', 'global'], function(logger, global) {

	var registeredSensors = {};

	function registerSensor(name, sensorFactory) {
		registeredSensors[name] = sensorFactory;
	}

	function createSensors(config) {
		var i, sensorNames = config.readySensors,
			sensorName,
			readySensorInstances = {},
			newPrepends = [];
		var api = {
			prepend: function(value) {
				newPrepends.push(value);
			},
			append: function(value) {
				config.appends.push(value);
			}
		};
		for(i = 0; i < sensorNames.length; i++) {
			sensorName = sensorNames[i];
			readySensorInstances[sensorName] = registeredSensors[sensorName](api);
		}
		// Be sure that the prepends of the sensors are always before all
		// other prepends!
		config.prepends.unshift.apply(config.prepends, newPrepends);

		return readySensorInstances;
	}

	// Goal:
	// - Detect async work that cannot detected before some time after it's start
	//   (e.g. the WebKitAnimationStart event is not fired until some ms after the dom change that started the animation).
	// - Detect the situation where async work starts another async work
	//
	// Algorithm:
	// Wait until all readySensors did not change for 50ms.


	function ready(sensorInstances, listener) {
		var sensorStatus;

		function restart() {
			sensorStatus = aggregateSensorStatus(sensorInstances);
			if(sensorStatus.busySensors.length !== 0) {
				logger.log("ready waiting for [" + sensorStatus.busySensors + "]");
				global.setTimeout(restart, 20);
			} else {
				global.setTimeout(ifNoAsyncWorkCallListenerElseRestart, 50);
			}
		}

		function ifNoAsyncWorkCallListenerElseRestart() {
			var currentSensorStatus = aggregateSensorStatus(sensorInstances);
			if(currentSensorStatus.busySensors.length === 0 && currentSensorStatus.count === sensorStatus.count) {
				listener();
			} else {
				restart();
			}
		}

		restart();
	}

	function aggregateSensorStatus(sensorInstances) {
		var count = 0,
			busySensors = [],
			sensorName, sensor, sensorStatus;
		for(sensorName in sensorInstances) {
			sensor = sensorInstances[sensorName];
			sensorStatus = sensor();
			count += sensorStatus.count;
			if(!sensorStatus.ready) {
				busySensors.push(sensorName);
			}
		}
		return {
			count: count,
			busySensors: busySensors
		};
	}

	return {
		registerSensor: registerSensor,
		createSensors: createSensors,
		ready: ready
	};
});