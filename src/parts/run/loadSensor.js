uitest.define('run/loadSensor', ['run/ready', 'run/config'], function(readyModule, runConfig) {

	var count = 0,
		ready, win, doc, waitForDocComplete;

	init();
	runConfig.appends.push(function(window, document) {
		win = window;
		doc = document;
		waitForDocComplete = true;
	});

	loadSensor.reloaded = reloaded;

	readyModule.addSensor("load", loadSensor);
	return loadSensor;

	function init() {
		ready = false;
		waitForDocComplete = false;
	}

	function loadSensor() {
		if (waitForDocComplete && docReady(doc)) {
			waitForDocComplete = false;
			// this timeout is required for IE, as it sets the
			// readyState to "interactive" before the DOMContentLoaded event.
			win.setTimeout(function() {
				ready = true;
			},1);
		}
		return {
			count: count,
			ready: ready
		};
	}

	function docReady(doc) {
		return doc.readyState==='complete' || doc.readyState==='interactive';
	}

	function reloaded(callback) {
		count++;
		init();
		readyModule.ready(callback);
	}
});
