uitest.define('run/loadSensor', ['run/ready', 'run/eventSource'], function(readyModule, eventSource) {

	var count = -1,
		ready, win, doc, waitForDocComplete;

	eventSource.on('addAppends', function(event, done) {
		event.handlers.push(function(window, document) {
			win = window;
			doc = document;
			waitForDocComplete = true;
		});
		done();
	});

	loadSensor.init = init;
	init();

	readyModule.addSensor("load", loadSensor);
	return loadSensor;

	function init() {
		count++;
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
});
