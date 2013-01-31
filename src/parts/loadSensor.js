uitest.define('loadSensor', ['ready'], function(ready) {
	var LOAD_SENSOR_NAME = "load";

	function loadSensorFactory(installer) {
		var count = 0,
			ready, doc, waitForDocComplete;
		
		init();
		installer.append(function(document) {
			doc = document;
			waitForDocComplete = true;
		});
		return loadSensor;

		function init() {
			ready = false;
			waitForDocComplete = false;
		}

		function loadSensor(reload) {
			if (waitForDocComplete && doc.readyState==='complete') {
				waitForDocComplete = false;
				ready = true;
			}
			if(reload) {
				count++;
				init();
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
