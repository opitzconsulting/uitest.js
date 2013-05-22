uitest.define('run/feature/fakeHistory', ['run/eventSource', 'run/main', 'run/feature/locationProxy', 'urlParser', 'sniffer'], function(eventSource, main, locationProxy, urlParser, sniffer) {
    var historyStack = [],
        currentIndex = -1,
        testWin,
        testWinInitUrl;
    eventSource.on('addPrepends', function(event, done) {
        event.handlers.push(initFakeHistory);
        done();
    });

    eventSource.on('loc:reload', function(event, done) {
        addNonPushStateEntry(event.newHref, event.newHref, event.replace);
        done();
    });
    eventSource.on('loc:hash', function(event, done) {
        addNonPushStateEntry(testWinInitUrl, event.newHref, event.replace);
        done();
    });

    function initFakeHistory(window, location) {
        var history = window.history;
        testWinInitUrl = location.href;
        testWin = window;
        if (currentIndex===-1) {
            addNonPushStateEntry(testWinInitUrl, location.href, false);
        }
        // Note: Can't replace the whole window.history in IE10 :-(        
        history.go = go;
        history.back = back;
        history.forward = forward;
        if (sniffer.history) {
            history._pushState = history.pushState;
            history.pushState = function(state, title, href) {
                // TODO make href absolute!
                addEntry({
                    href: href,
                    state: state,
                    title: title,
                    initHref: testWinInitUrl
                }, false);
                history._pushState(state, title, href);
            };
            history.replaceState = function(state, title, href) {
                // TODO make href absolute!
                addEntry({
                    href: href,
                    state: state,
                    title: title,
                    initHref: testWinInitUrl
                }, true);
                history._pushState(state, title, href);
            };
        }
        function go(relativeIndex) {
            var newIndex = currentIndex+relativeIndex,
                oldEntry = historyStack[currentIndex],
                entry,
                evt;
            if (newIndex<0) {
                throw new Error("Cannot go before the first history entry!");
            } else if (newIndex>=historyStack.length) {
                newIndex = historyStack.length-1;
            }
            currentIndex = newIndex;
            entry = historyStack[currentIndex];
            if (sniffer.history && oldEntry.initHref === entry.initHref) {
                // See http://www.whatwg.org/specs/web-apps/current-work/#traverse-the-history
                window.setTimeout(function() {
                    history._pushState(entry.state, entry.title, entry.href);
                    evt = createEvent(window, "PopStateEvent", "popstate");
                    evt.state = entry.state;
                    window.dispatchEvent(evt);
                    if (hashChanged(oldEntry.href, entry.href)) {
                        evt = createEvent(window, "HashChangeEvent", "hashchange");
                        evt.oldURL = oldEntry.href;
                        evt.newURL = entry.href;
                        window.dispatchEvent(evt);
                    }
                },0);
            } else {
                // TODO: if initHref changed, manually trigger a reload
                // TODO: Otherwise use window.location, and not window.locationProxy,
                // as we don't want another entry in the history!
                window.locationProxy.href = entry.href;
            }
        }
        function back() {
            go(-1);
        }
        function forward() {
            go(1);
        }
    }

    function createEvent(win, eventObjName, eventName) {
        if (!(eventObjName in win)) {
            // For IE: creating "HashChangeEvent" needs a normal "Event"
            eventObjName = 'Event';
        }
        var evt = win.document.createEvent(eventObjName);
        evt.initEvent(eventName, true, false);
        return evt;
    }

    function addNonPushStateEntry(initHref, href, replace) {
        var currentEntry = historyStack[currentIndex];
        if (currentEntry && href===currentEntry.href) {
            return;
        }
        addEntry({
            initHref: initHref,
            href: addHashIfNeeded(href),
            state: testWin.history.state,
            title: testWin.document.title
        }, replace);
    }

    function addEntry(entry, replace) {
        historyStack.splice(currentIndex+1, historyStack.length-currentIndex-1);
        if (currentIndex>=0 && replace) {
            historyStack[currentIndex] = entry;
        } else {
            historyStack.push(entry);
            currentIndex = historyStack.length-1;
        }
    }

    function addHashIfNeeded(href) {
        if (sniffer.history) {
            return href;
        }
        var index = href.indexOf('#');
        if (index===-1) {
            return href+'#';
        }
        return href;
    }

    function hashChanged(href1, href2) {
        return removeHash(href1)===removeHash(href2) && href1!==href2;
    }

    function removeHash(href) {
        var hashPos = href.indexOf('#');
        if (hashPos === -1) {
            return href;
        }
        return href.substring(0, hashPos);
    }
});