uitest.define('run/initialHistoryFix', ['run/eventSource'], function(eventSource) {
    // needs to be executed before the normal prepends
    addPrepends.priority = 99999;
    eventSource.on("addPrepends", addPrepends);

    function addPrepends(event, done) {
        var originalUrl = event.state.htmlUrl;
        event.handlers.unshift(fixHistory);
        done();

        function fixHistory(history, location) {
            // Bugs fixed here:
            // - IE looses the hash when rewriting using a js url
            // - Rewriting using a js url or doc.open/write/close deletes the current history entry.
            //   This yields to problems when using history.back()!
            //   (at least in a fresh Chrome in Inkognito mode)
            // - PhantomJS: creating a history entry using hash change does not work correctly.
            //   Using history.pushState however does work...
            if (history.pushState) {
                history.pushState(null, "", originalUrl);
            } else {
                var currHash = hash(originalUrl);
                location.hash = "someUniqueHashToCreateAHistoryEntry";
                location.hash = currHash;
            }
        }
    }

    function hash(url) {
        var hashPos = url.indexOf('#');
        if (hashPos !== -1) {
            return url.substring(hashPos);
        } else {
            return '';
        }
    }
});