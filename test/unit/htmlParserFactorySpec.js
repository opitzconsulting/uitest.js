describe('htmlParserFactory', function() {
    var parser, parse, serialize;
    beforeEach(function() {
        parser = uitest.require(["htmlParserFactory"]).htmlParserFactory();
        parse = parser.parse;
        serialize = parser.serialize;
    });

    it('should parse comments', function() {
        expect(parse('<!---->')).toEqual([{type:'comment', content:'', match: '<!---->'}]);
        expect(parse('<!----><!---->').length).toBe(2);
        expect(parse('<!--a-->')).toEqual([{type:'comment', content:'a', match: '<!--a-->'}]);
        expect(parse('<!--a\nb-->')).toEqual([{type:'comment', content:'a\nb', match: '<!--a\nb-->'}]);
    });

    it('should parse content script tags', function() {
        expect(parse('<script>c</script>')).toEqual([{type:'contentscript', content:'c', attrs: '', match: '<script>c</script>'}]);
        expect(parse('<script a="b">c</script>')).toEqual([{type:'contentscript', content:'c', attrs: ' a="b"', match: '<script a="b">c</script>'}]);
        expect(parse('<script>c</script><script>c</script>').length).toBe(2);
    });

    it('should serialize content script tags', function() {
        expect(serialize([{type:'contentscript', content:'c', attrs: ''}])).toEqual('<script>c</script>');
        expect(serialize([{type:'contentscript', content:'c', attrs: ' a=b'}])).toEqual('<script a=b>c</script>');
    });

    it('should parse url script tags', function() {
        expect(parse('<script src="someUrl">c</script>')).toEqual([{type:'urlscript', src:'someUrl', preAttrs:'', postAttrs: '', match: '<script src="someUrl">c</script>'}]);
        expect(parse('<script src="someUrl"></script><script src="someUrl"></script>').length).toEqual(2);
        expect(parse('<script src = "someUrl" a>c</script>')).toEqual([{type:'urlscript', preAttrs: '', postAttrs: ' a', src:'someUrl', match: '<script src = "someUrl" a>c</script>'}]);
        expect(parse('<script a src="someUrl" b>c</script>')).toEqual([{type:'urlscript', preAttrs: ' a', postAttrs: ' b', src:'someUrl', match: '<script a src="someUrl" b>c</script>'}]);
    });

    it('should serialize url script tags', function() {
        expect(serialize([{type:'urlscript', src:'someSrc'}])).toEqual('<script src="someSrc"></script>');
        expect(serialize([{type:'urlscript', src:'someSrc', preAttrs: ' a', postAttrs: ' b'}])).toEqual('<script a src="someSrc" b></script>');
    });

    it('should parse head start tags', function() {
        expect(parse('<head>')).toEqual([{type:'headstart', match: '<head>'}]);
        expect(parse('<head a="b">')).toEqual([{type:'headstart', match: '<head a="b">'}]);
    });

    it('should parse body start tags', function() {
        expect(parse('<body>')).toEqual([{type:'bodystart', match: '<body>'}]);
        expect(parse('<body a="b">')).toEqual([{type:'bodystart', match: '<body a="b">'}]);
    });

    it('should parse body end tags', function() {
        expect(parse('</body>')).toEqual([{type:'bodyend', match: '</body>'}]);
        expect(parse('< / body>')).toEqual([{type:'bodyend', match: '< / body>'}]);
    });

    it('should replace empty xhtml tags with open/close tags in parse and transform', function() {
        expect(parse('<test/>')).toEqual([{type:'other', match: '<test></test>'}]);
    });
});
