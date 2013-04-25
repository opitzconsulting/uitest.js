describe('run/namedFunctionInstrumentor', function() {
    var eventSource, runConfig, scriptInstrumentor;
    beforeEach(function() {
        runConfig = {};
        var modules = uitest.require({
            "run/config": runConfig
        },["run/namedFunctionInstrumentor", "run/eventSource", "run/scriptInstrumentor"]);
        eventSource = modules["run/eventSource"];
        scriptInstrumentor = modules["run/scriptInstrumentor"];
    });
    describe('parse named functions', function() {
        var parse, serialize;
        beforeEach(function() {
            parse = scriptInstrumentor.jsParser.parse;
            serialize = scriptInstrumentor.jsParser.serialize;
        });
        it('should parse named functions', function() {
            var input = "function only(){";
            expect(parse(input)).toEqual([{type:'functionstart', name: "only", match: input }]);
            input = "afunction only(){";
            expect(parse(input)).toEqual([{type:'other', match: input }]);
            input = "function (){";
            expect(parse(input)).toEqual([{type:'other', match: input }]);
            input = "function only () {";
            expect(parse(input)).toEqual([{type:'functionstart', name: "only", match: input }]);
            input = "function only(a) {";
            expect(parse(input)).toEqual([{type:'functionstart', name: "only", match: input }]);
            input = "function begin(){a";
            expect(parse(input)).toEqual([{type:'functionstart', name: "begin", match: "function begin(){"},{type:'other', match: "a"}]);
        });

        it('should serialize new named functions', function() {
            expect(serialize([{type:'functionstart', name: "fn"}])).toEqual('function fn(){');
        });
    });
});