uitest.define('loadSensor', ['ready'], function(ready) {
	var LOAD_SENSOR_NAME = "load";

	// TODO implement the load sensor!
	// Idea: wait for installer.append() to be called
	// and document.readyState
	// Also check document.readyState in addition.

	function loadSensorFactory(installer) {
		var count = 0,
			ready = true;
		return loadSensor;

		function loadSensor(reload) {
			if(reload) {
				count++;
				ready = false;
			}
			return {
				count: count,
				ready: ready
			};
		}
	}

	function waitForReload(sensorInstances) {
		sensorInstances[LOAD_SENSOR_NAME](true);
	}

	ready.registerSensor(LOAD_SENSOR_NAME, loadSensorFactory);

	return {
		sensorFactory: loadSensorFactory,
		sensorName: LOAD_SENSOR_NAME,
		waitForReload: waitForReload
	};
});
