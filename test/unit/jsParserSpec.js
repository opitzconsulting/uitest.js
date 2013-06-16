describe('jsParserFactory', function() {
    var jsparser, someState, eventSource;
    beforeEach(function() {
        var modules;
        someState = {};
        modules = uitest.require(["jsParser", "eventSourceFactory"]);
        jsparser = modules.jsParser;
        eventSource = modules.eventSourceFactory();
        eventSource.on("js:location", function(event, end) {
            event.replace = "$loc$";
            end();
        });
        eventSource.on("js:namedFunctionStart", function(event, end) {
            event.append = "$"+event.name+"$";
            end();
        });
    });

    function transform(input) {
        var result;
        jsparser({
            input: input,
            eventSource: eventSource,
            state: someState
        }, function(error, _result) {
            result = _result;
        });
        return result;
    }

    function shouldSkip(pattern) {
        it('should skip "'+pattern+'"', function() {
            expect(transform(pattern)).toEqual(pattern);
        });
    }
    describe('location', function() {
        function shouldDetect(pattern) {
            it('should detect "'+pattern+'"', function() {
                expect(transform(pattern)).toEqual(pattern.replace('location', '$loc$'));
            });
        }
        describe('property assignments', function() {
            shouldDetect("location.href=1");
            shouldDetect("location.hash=1");
            shouldSkip("location.asdf=1");
            shouldSkip("alocation.href=1");
        });
        describe('change functions', function() {
            shouldDetect("location.reload(1)");
            shouldDetect("location.assign(1)");
            shouldDetect("location.replace(1)");
            shouldSkip("location.test(1)");
            shouldSkip("alocation.reload(1)");
        });
        describe('variable assignments', function() {
            shouldDetect("a=window.location");
            shouldDetect("a=window.location;");
            shouldDetect("a=window.location,");
            shouldSkip("a=window.location.href");
        });
        describe('return statements', function() {
            shouldDetect("return window.location;");
            shouldSkip("return location;");
        });
    });
    describe('named function start', function() {
        function shouldDetect(pattern) {
            it('should detect "'+pattern+'"', function() {
                expect(transform(pattern)).toEqual(pattern.replace('{', '{$a$'));
            });
        }
        shouldDetect("function a(){");
        shouldSkip("function (){");
    });
});