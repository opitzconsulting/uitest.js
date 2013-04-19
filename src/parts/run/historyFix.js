uitest.define('run/historyFix', ['run/htmlInstrumentor', 'run/config'], function(htmlInstrumentor, runConfig) {
    var currentUrl;

    // This needs to be before the normal scriptAdder!
    preprocessHtml.priority = 9999;
    htmlInstrumentor.addPreProcessor(preprocessHtml);

    runConfig.prepends.unshift(fixHistory);

    function preprocessHtml(event, control) {
        var state = event.state,
            token = event.token;

        if (!state.historyFix) {
            state.historyFix = true;
            currentUrl = state.url;
        }
        control.next();
    }

    function hash(url) {
        var hashPos = url.indexOf('#');
        if (hashPos!==-1) {
            return url.substring(hashPos);
        } else {
            return '';
        }
    }

    function fixHistory(history, location) {
        // Bugs fixed here:
        // - IE looses the hash when rewriting using a js url
        // - Rewriting using a js url or doc.open/write/close deletes the current history entry.
        //   This yields to problems when using history.back()!
        //   (at least in a fresh Chrome in Inkognito mode)
        // - PhantomJS: creating a history entry using hash change does not work correctly.
        //   Using history.pushState however does work...
        if (history.pushState) {
            history.pushState(null, "", currentUrl);
        } else {
            var currHash = hash(currentUrl);
            location.hash="someUniqueHashToCreateAHistoryEntry";location.hash=currHash;
        }
    }
});