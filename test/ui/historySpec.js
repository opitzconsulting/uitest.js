// TODO: Implement a workaround for this!
describe('history', function() {
    var uit = uitest.current;
    uit.url( "../test/ui/fixtures/empty.html");
    uit.feature('fakeHistory');
    // TODO document problems with history support in browsers!
    // - IE: going back in iframe does not update location.href
    // - Android: Also some bugs...
    // Todo: Then remove this here!
    // Android: this tests makes testacular reload the page. WHY?
    // - Note: testacular/debug.html does not have the problem,
    // - nor an iframe that loads testacular/debug.html!!
    // IE8/9: fails always
    it('should be able to go back when gone two steps forward using hashchange', function() {
        uit.runs(function(location, history) {
            location.hash = '1';
            location.hash = '2';
            history.back();
        });
        waits(100);
        uit.runs(function(location) {
            expect(location.hash).toBe('#1');
        });
    });
    describe('hashchange', function() {
        it('should trigger hashchange events when changing location.href', function() {
            var hashChangeEvents = [];
            uit.runs(function(window, location, history) {
                window.onhashchange = function(e) {
                    hashChangeEvents.push(e);
                };
                location.href += '#1';
            });
            uit.runs(function() {
                expect(hashChangeEvents.length).toBe(1);
            });
        });
        it('should trigger hashchange event when going back', function() {
            var hashChangeEvents = [];
            uit.runs(function(window, location, history) {
                window.onhashchange = function(e) {
                    hashChangeEvents.push(e);
                };
                location.hash = '#1';
            });
            uit.runs(function(history) {
                hashChangeEvents = [];
                history.back();
            });
            uit.runs(function(location) {
                expect(hashChangeEvents.length).toBe(1);
            });
        });
        it('should go back to an initial hash url', function() {
            uit.url( "../test/ui/fixtures/empty.html#init");
            uit.runs(function(location, history) {
                location.hash = '#1';
                expect(location.hash).toBe('#1');
                history.back();
            });
            uit.runs(function(location) {
                expect(location.hash).toBe('#init');
            });
        });
        it('should go back to an initial url without a hash', function() {
            uit.url( "../test/ui/fixtures/empty.html");
            uit.runs(function(location, history) {
                location.hash = '#1';
                expect(location.hash).toBe('#1');
                history.back();
            });
            uit.runs(function(location) {
                expect(location.hash).toBe('');
            });
        });
    });
    if (window.history.pushState) {
        describe('pushState', function() {
            it('should trigger popState and hashChange when going back', function() {
                var popStateEvents = [],
                    hashChangeEvents = [],
                    someState = {a:1},
                    someTitle = 'someTitle';
                uit.runs(function(window, history, location) {
                    window.onpopstate = function(e) {
                        popStateEvents.push(e);
                    };
                    window.onhashchange = function(e) {
                        hashChangeEvents.push(e);
                    };
                    history.pushState(someState, someTitle, location.href+'#hash');
                    history.back();
                });
                uit.runs(function(window, history) {
                    expect(popStateEvents.length).toBe(1);
                    expect(hashChangeEvents.length).toBe(1);
                });
            });
            it('should restore the old history state and href when going back', function() {
                var oldHref,
                    oldState,
                    someState = {a:1},
                    someTitle = 'someTitle',
                    someUrl = '/someUrl';
                uit.runs(function(window, history, location) {
                    oldHref = location.href;
                    oldState = history.state;
                    window.flag = true;
                    history.pushState(someState, someTitle, someUrl);
                    expect(location.pathname).toBe(someUrl);
                    // TODO state is not saved in PhantomJS after calling
                    // pushState! -> General error in PhantomJS!
                    // expect(history.state).toEqual(someState);
                    history.back();
                });
                uit.runs(function(window, history, location) {
                    expect(window.flag).toBe(true);
                    // TODO state is not saved in PhantomJS after calling
                    // pushState! -> General error in PhantomJS!
                    expect(history.state).toEqual(oldState);
                    expect(location.href).toBe(oldHref);
                });
            });
            // TODO fire popState when going back over page boundary
        });
    }
});