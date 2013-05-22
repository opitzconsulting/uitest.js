ddescribe('jsParserFactory', function() {
    var jsparser, parse, serialize;
    beforeEach(function() {
        jsparser = uitest.require(["jsParserFactory"]).jsParserFactory();
        parse = jsparser.parse;
        serialize = jsparser.serialize;
    });

    describe('comments, strings and regex', function() {
        it('should parse line comments', function() {
            expect(parse("//a")).toEqual([{type:'comment', match:'//a'}]);
            expect(parse("//a\nb")).toEqual([{type:'comment', match:'//a\n'},{type:'other', match:'b'}]);
        });
        it('should parse block comments', function() {
            expect(parse("/**/")).toEqual([{type:'comment', match:'/**/'}]);
            expect(parse("/*\n*/")).toEqual([{type:'comment', match:'/*\n*/'}]);
            expect(parse("/*a*//*b*/")).toEqual([{type:'comment', match:'/*a*/'},{type:'comment', match:'/*b*/'}]);
            expect(parse("a/**/b")).toEqual([{type:'other', match:'a'},{type:'comment', match:'/**/'},{type:'other', match:'b'}]);
            expect(parse("/*//*/b")).toEqual([{type:'comment', match:'/*//*/'},{type:'other', match:'b'}]);
            expect(parse("/*'*/b")).toEqual([{type:'comment', match:"/*'*/"},{type:'other', match:'b'}]);
        });
        it('should parse single quote strings', function() {
            expect(parse("'a'")).toEqual([{type:'string', match:"'a'"}]);
            expect(parse("'a'b")).toEqual([{type:'string', match:"'a'"},{type:'other', match:"b"}]);
            expect(parse("'a")).toEqual([{type:'string', match:"'a"}]);
            expect(parse("'a\\'b")).toEqual([{type:'string', match:"'a\\'b"}]);
            expect(parse("'//'b")).toEqual([{type:'string', match:"'//'"},{type:'other', match:"b"}]);
            expect(parse("'/**/'b")).toEqual([{type:'string', match:"'/**/'"},{type:'other', match:"b"}]);
        });
        it('should parse double quote strings', function() {
            expect(parse('"a"')).toEqual([{type:"string", match:'"a"'}]);
            expect(parse('"a"b')).toEqual([{type:"string", match:'"a"'},{type:"other", match:'b'}]);
            expect(parse('"a')).toEqual([{type:"string", match:'"a'}]);
            expect(parse('"a\\"b')).toEqual([{type:"string", match:'"a\\"b'}]);
            expect(parse('"//"b')).toEqual([{type:"string", match:'"//"'},{type:"other", match:'b'}]);
            expect(parse('"/**/"b')).toEqual([{type:"string", match:'"/**/"'},{type:"other", match:'b'}]);
        });
        it('should parse regex', function() {
            expect(parse('/a/')).toEqual([{type:"re", match:'/a/'}]);
            expect(parse('/a')).toEqual([{type:"re", match:'/a'}]);
            expect(parse('/a"/')).toEqual([{type:"re", match:'/a"/'}]);
            expect(parse("/a'/")).toEqual([{type:"re", match:"/a'/"}]);
            expect(parse("/a\\/a")).toEqual([{type:"re", match:"/a\\/a"}]);
        });
    });

    describe('serialize', function() {
        it('should concat the match entry of all tokens', function() {
            expect(serialize([{match:'a'},{match:'b'}])).toBe('ab');
        });
    });

    describe('location', function() {
        function shouldSkip(pattern) {
            it('should skip "'+pattern+'"', function() {
                expect(parse(pattern)).toEqual([{type:'other', match:pattern}]);
            });
        }
        function shouldDetect(pattern) {
            it('should detect "'+pattern+'"', function() {
                var locationStart = pattern.indexOf('location'),
                    locationEnd = locationStart+8;
                var expected = [];
                if (locationStart>0) {
                    expected.push({type: 'other', match:pattern.substring(0, locationStart)});
                }
                expected.push({type:'location', match: 'location'});
                if (locationEnd<pattern.length) {
                    expected.push({type: 'other', match:pattern.substring(locationEnd)});
                }
                expect(parse(pattern)).toEqual(expected);
            });
        }
        describe('normal matches', function() {
            shouldDetect("location");
            shouldDetect("a\nlocation");
            shouldSkip("location$");
            shouldSkip("$location");
            shouldSkip("Location");
        });
        describe('matches with prefix/suffix operators', function() {
            shouldDetect("win.location");
            shouldDetect("location.x=");
            shouldDetect("return location;");
            shouldSkip("var location");
            shouldSkip("var x,location");
            shouldSkip("location=");
        });
    });
});