uitest.define('run/loadSensor', ['run/ready', 'run/config'], function(readyModule, runConfig) {

	var count = 0,
		ready, doc, waitForDocComplete;

	init();
	runConfig.appends.push(function(document) {
		doc = document;
		waitForDocComplete = true;
	});
	readyModule.addSensor("load", loadSensor);

	return {
		sensor: loadSensor,
		reloaded: reloaded
	};

	function init() {
		ready = false;
		waitForDocComplete = false;
	}

	function loadSensor() {
		if (waitForDocComplete && doc.readyState==='complete') {
			waitForDocComplete = false;
			ready = true;
		}
		return {
			count: count,
			ready: ready
		};
	}

	function reloaded(callback) {
		count++;
		init();
		readyModule.ready(callback);
	}
});
