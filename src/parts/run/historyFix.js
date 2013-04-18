uitest.define('run/historyFix', ['run/htmlInstrumentor', 'run/config'], function(htmlInstrumentor, runConfig) {
    // This needs to be before the normal scriptAdder!
    preprocessHtml.priority = 9999;
    htmlInstrumentor.addPreProcessor(preprocessHtml);

    function preprocessHtml(event, control) {
        var state = event.state,
            token = event.token;

        if (!state.historyFix) {
            state.historyFix = true;
            runConfig.prepends.unshift(fixHistory(state.url));
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

    function fixHistory(url) {
        // Bugs fixed here:
        // - IE looses the hash when rewriting using a js url
        // - Rewriting using a js url or doc.open/write/close deletes the current history entry.
        //   This yields to problems when using history.back()!
        //   (at least in a fresh Chrome in Inkognito mode)
        // - PhantomJS: creating a history entry using hash change does not work correctly.
        //   Using history.pushState however does work...
        var currHash = hash(url);
        return function(history, location) {
            if (history.pushState) {
                history.pushState(null, "", currHash);
            } else {
                location.hash="someUniqueHashToCreateAHistoryEntry";location.hash=currHash;
            }
        };
    }
});