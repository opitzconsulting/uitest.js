describe('jsParserFactory', function() {
    var jsparser, parse, serialize;
    beforeEach(function() {
        jsparser = uitest.require(["jsParserFactory"]).jsParserFactory();
        parse = jsparser.parse;
        serialize = jsparser.serialize;
    });

    it('should parse strings with quotes', function() {
        var input = "'asdf'";
        expect(parse(input)).toEqual([{type:'sqstring', content: "asdf", match:input}]);
        input = "'a''b'";
        expect(parse(input)).toEqual([{type:'sqstring', content: "a", match:"'a'"},{type:'sqstring', content: "b", match:"'b'"}]);
        input = "'as\\'df'";
        expect(parse(input)).toEqual([{type:'sqstring', content: "as\\'df", match: input}]);
        input = "'as\\ndf'";
        expect(parse(input)).toEqual([{type:'sqstring', content: "as\\ndf", match: input}]);
    });

    it('should serialize new single quote strings', function() {
        expect(serialize([{type:'sqstring', content: "a"}])).toEqual("'a'");
    });

    it('should parse strings with doublequotes', function() {
        var input = '"asdf"';
        expect(parse(input)).toEqual([{type:'dqstring', content: 'asdf', match: input}]);
        input = '"as\\ndf"';
        expect(parse(input)).toEqual([{type:'dqstring', content: 'as\\ndf', match: input}]);
        input = '"as\\"df"';
        expect(parse(input)).toEqual([{type:'dqstring', content: 'as\\"df', match: input}]);
    });

    it('should serialize new double quote strings', function() {
        expect(serialize([{type:'dqstring', content: "a"}])).toEqual('"a"');
    });

    it('should parse line comments', function() {
        var input = "//only";
        expect(parse(input)).toEqual([{type:'linecomment', content: "only", match: input}]);
        input = "a//end";
        expect(parse(input)).toEqual([{type:'other', match: "a"}, {type:'linecomment', content: "end", match: "//end"}]);
    });

    it('should serialize new linecomments', function() {
        expect(serialize([{type:'linecomment', content: "a"}])).toEqual('//a');
    });

    it('should parse block comments', function() {
        var input = "/*only*/";
        expect(parse(input)).toEqual([{type:'blockcomment', content: "only", match: input}]);
        input = "/*multi\nline*/";
        expect(parse(input)).toEqual([{type:'blockcomment', content: "multi\nline", match:input}]);
        input = "a/*end*/";
        expect(parse(input)).toEqual([{type:'other', match: "a"}, {type:'blockcomment', content: "end", match: "/*end*/"}]);
        input = "/*start*/a";
        expect(parse(input)).toEqual([{type:'blockcomment', content: "start", match:"/*start*/"},{type:'other', match: "a"}]);
        input = "a/*middle*/b";
        expect(parse(input)).toEqual([{type:'other', match: "a"},{type:'blockcomment', content: "middle", match: "/*middle*/"},{type:'other', match: "b"}]);
    });

    it('should serialize new block comments', function() {
        expect(serialize([{type:'blockcomment', content: "a"}])).toEqual('/*a*/');
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