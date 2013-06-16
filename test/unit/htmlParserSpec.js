describe('htmlParserFactory', function () {
    var htmlParser, someState, eventSource;
    beforeEach(function () {
        var modules;
        someState = {};
        modules = uitest.require(["htmlParser", "eventSourceFactory"]);
        htmlParser = modules.htmlParser;
        eventSource = modules.eventSourceFactory();
    });

    function transform(input) {
        var result;
        htmlParser({
            input: input,
            eventSource: eventSource,
            eventPrefix: 'html:',
            state: someState
        }, function (error, _result) {
            result = _result;
        });
        return result;
    }

    function collectEvents(eventName, input) {
        var events = [];
        eventSource.on(eventName, function (event, end) {
            events.push(event);
            end();
        });
        transform(input);
        return events;
    }

    describe('end tags', function() {
        it('parses normal tags', function () {
            var events = collectEvents('html:someTag:end', '<someTag></someTag>'),
                event = events[0];
            expect(events.length).toBe(1);
            expect(event.token.type).toBe('end');
            expect(event.token.name).toBe('someTag');
        });

        it('parses empty tags', function () {
            var events = collectEvents('html:someTag:end', '<someTag/>'),
                event = events[0];
            expect(events.length).toBe(1);
            expect(event.token.type).toBe('end');
            expect(event.token.name).toBe('someTag');
        });

        it('serializes empty tags', function() {
            expect(transform('<someTag/>')).toBe('<someTag></someTag>');
        });

        it('prepends and appends text', function() {
            eventSource.on('html:someTag:end', function (event, end) {
                event.prepend.push('somePrepend');
                event.append.push('someAppend');
                end();
            });
            expect(transform('<someTag></someTag>')).toBe('<someTag>somePrepend</someTag>someAppend');

        });
    });

    describe('start tags', function () {
        it('parses normal tags', function () {
            var events = collectEvents('html:someTag:start', '<someTag></someTag>'),
                event = events[0];
            expect(events.length).toBe(1);
            expect(event.token.type).toBe('start');
            expect(event.token.name).toBe('someTag');
        });

        it('parses empty tags', function () {
            var events = collectEvents('html:someTag:start', '<someTag/>'),
                event = events[0];
            expect(events.length).toBe(1);
            expect(event.token.type).toBe('start');
            expect(event.token.name).toBe('someTag');
        });

        it('parses attrs', function () {
            var events = collectEvents('html:someTag:start', '<someTag someAttr="someValue"></someTag>'),
                event = events[0];
            expect(event.token.attrs.someAttr).toBe('someValue');
        });
        it('parses multiple attrs', function () {
            var events = collectEvents('html:someTag:start', '<someTag a="b" c="d"></someTag>'),
                event = events[0];
            expect(event.token.attrs.a).toBe('b');
            expect(event.token.attrs.c).toBe('d');
        });
        it('parses boolean attrs', function () {
            var events = collectEvents('html:someTag:start', '<someTag someBooleanAttr></someTag>'),
                event = events[0];
            expect("someBooleanAttr" in event.token.attrs).toBe(true);
            expect(event.token.attrs.someBooleanAttr).toBeUndefined();
        });
        it('serializes attrs', function() {
            eventSource.on('html:someTag:start', function (event, end) {
                event.token.attrs = {a: 'b'};
                end();
            });
            expect(transform('<someTag></someTag>')).toBe('<someTag a="b"></someTag>');
        });
        it('serializes multiple attrs', function() {
            eventSource.on('html:someTag:start', function (event, end) {
                event.token.attrs = {a: 'b', c: 'd'};
                end();
            });
            expect(transform('<someTag></someTag>')).toBe('<someTag a="b" c="d"></someTag>');
        });
        it('serializes boolean attrs', function() {
            eventSource.on('html:someTag:start', function (event, end) {
                event.token.attrs = {a: undefined};
                end();
            });
            expect(transform('<someTag></someTag>')).toBe('<someTag a></someTag>');
        });
        it('prepends and appends text', function() {
            eventSource.on('html:someTag:start', function (event, end) {
                event.prepend.push('somePrepend');
                event.append.push('someAppend');
                end();
            });
            expect(transform('<someTag></someTag>')).toBe('somePrepend<someTag>someAppend</someTag>');

        });
    });

    describe('simple tags', function() {
        it('parses simple tags', function() {
            var events = collectEvents('html:script:simple', '<script a="b">someContent</script>'),
                event = events[0];
            expect(events.length).toBe(1);
            expect(event.token.type).toBe('simple');
            expect(event.token.name).toBe('script');
            expect(event.token.attrs.a).toBe('b');
            expect(event.token.content).toBe('someContent');
        });
        it('serializes simple tags', function() {
            eventSource.on('html:script:simple', function (event, end) {
                event.token.attrs = {a: 'b'};
                event.token.content = 'someOtherContent';
                end();
            });
            expect(transform('<script></script>')).toBe('<script a="b">someOtherContent</script>');
        });
        it('prepends and appends text', function() {
            eventSource.on('html:script:simple', function (event, end) {
                event.prepend.push('somePrepend');
                event.append.push('someAppend');
                end();
            });
            expect(transform('<script></script>')).toBe('somePrepend<script></script>someAppend');

        });
    });

    describe('prepend and append tokens', function() {
        it('processes prepend tokens', function() {
            var events = [];
            eventSource.on('html:script:simple', function (event, end) {
                event.prepend.push({
                    type: 'start',
                    name: 'someTag',
                    attrs: {}
                });
                event.append.push({
                    type: 'end',
                    name: 'someTag'
                });
                end();
            });
            expect(transform('<script></script>')).toBe('<someTag><script></script></someTag>');

        });
    });
});
