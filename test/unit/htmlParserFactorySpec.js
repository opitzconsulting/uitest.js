ddescribe('htmlParserFactory', function() {
    var parser, parse, serialize;
    beforeEach(function() {
        parser = uitest.require(["htmlParserFactory"]).htmlParserFactory();
        parse = parser.parse;
        serialize = parser.serialize;
    });

    it('should parse comments', function() {
        expect(parse('<!---->')).toEqual([{type:'comment', match: '<!---->'}]);
        expect(parse('<!----><!---->').length).toBe(2);
        expect(parse('<!--a-->')).toEqual([{type:'comment', match: '<!--a-->'}]);
        expect(parse('<!--a\nb-->')).toEqual([{type:'comment', match: '<!--a\nb-->'}]);
    });

    it('should parse open tags', function() {
        expect(parse('<someTag>')).toEqual([{type:'startTag', name:'someTag', attrs: {}}]);
        expect(parse('<someTag a>')).toEqual([{type:'startTag', name:'someTag', attrs: {a:{value:undefined,index:0}}}]);
        expect(parse('<someTag a b>')).toEqual([{type:'startTag', name:'someTag', attrs: {a:{value:undefined,index:0},b:{value:undefined,index:1}}}]);
        expect(parse('<someTag a="b">')).toEqual([{type:'startTag', name:'someTag', attrs: {a:{value:"b",index:0}}}]);
    });

    it('should serialize open tags', function() {
        expect(serialize([{type:'startTag', name:'a', attrs:{}}])).toBe('<a>');
        expect(serialize([{type:'startTag', name:'a', attrs:{b:{index:0}}}])).toBe('<a b>');
        expect(serialize([{type:'startTag', name:'a', attrs:{c:{index:1},b:{index:0}}}])).toBe('<a b c>');
        expect(serialize([{type:'startTag', name:'a', attrs:{b:{index:0,value:'c'}}}])).toBe('<a b="c">');
    });

    it('should parse end tags', function() {
        expect(parse('</someTag>')).toEqual([{type:'endTag', name:'someTag'}]);
    });

    it('should serialize end tags', function() {
        expect(serialize([{type:'endTag', name:'a'}])).toBe('</a>');
    });

    it('should parse xhtml empty tags', function() {
        expect(parse('<someTag/>')).toEqual([{type:'simpleTag', name:'someTag', attrs:[], content: ''}]);
    });

    it('should merge open/close tags to simpleTags', function() {
        expect(parse('<someTag></someTag>')).toEqual([{type:'simpleTag', name:'someTag', attrs:[], content: ''}]);
        expect(parse('<someTag>someContent</someTag>')).toEqual([{type:'simpleTag', name:'someTag', attrs:[], content: 'someContent'}]);
    });

    it('should serialize simple tags', function() {
        expect(serialize([{type:'simpleTag', name:'a', attrs:[], content: ''}])).toBe('<a></a>');
        expect(serialize([{type:'simpleTag', name:'a', attrs:[], content: 'someContent'}])).toBe('<a>someContent</a>');
    });

    it('should not merge open/close tags with nested tags', function() {
        expect(parse('<a><b/></a>')).toEqual([{type:'startTag', name:'a', attrs:[]},{type:'simpleTag', name:'b', attrs:[], content: ''},{type:'endTag', name:'a'}]);
    });

    describe('mixed', function() {
        it('should parse comments with script tags', function() {
            expect(parse('<!-- <script></script> -->')).toEqual([
                { match : '<!-- <script></script> -->', type : 'comment' }
            ]);
        });
    });
});