uitest.require(['factory!urlParser'], function (urlParserFactory) {

    describe("urlParser", function () {
        var urlParser;
        beforeEach(function () {
            urlParser = urlParserFactory();
        });

        describe('parseUrl and serializeUrl', function () {
            it('should parse and serialize urls without query and hash', function () {
                var someUrl = 'http://someUrl';
                var actualUrl = urlParser.parseUrl(someUrl);
                expect(actualUrl).toEqual({
                    baseUrl:'http://someUrl',
                    hash:undefined,
                    query:[  ]
                });
                expect(urlParser.serializeUrl(actualUrl)).toEqual(someUrl);
            });
            it('should parse urls with hashes', function () {
                var someUrl = 'http://someUrl#123';
                var actualUrl = urlParser.parseUrl(someUrl);
                expect(actualUrl).toEqual({
                    baseUrl:'http://someUrl',
                    hash:"123",
                    query:[  ]
                });
                expect(urlParser.serializeUrl(actualUrl)).toBe(someUrl);
            });
            it('should parse urls with queries', function () {
                var someUrl = 'http://someUrl?a=b&c';
                var actualUrl = urlParser.parseUrl(someUrl);
                expect(actualUrl).toEqual({
                    baseUrl:'http://someUrl',
                    hash:undefined,
                    query:[ "a=b", "c" ]
                });
                expect(urlParser.serializeUrl(actualUrl)).toBe(someUrl);
            });
            it('should parse urls with queries and hashes', function () {
                var someUrl = 'http://someUrl?a=b&c#123';
                var actualUrl = urlParser.parseUrl(someUrl);
                expect(actualUrl).toEqual({
                    baseUrl:'http://someUrl',
                    hash:'123',
                    query:[ "a=b", "c" ]
                });
                expect(urlParser.serializeUrl(actualUrl)).toBe(someUrl);
            });
        });

        describe('setOrReplaceQueryAttr', function() {
            it('should add a new query attribute if not existing', function() {
                var data = {
                    query: []
                };
                urlParser.setOrReplaceQueryAttr(data, 'someProp', 'someValue');
                expect(data.query).toEqual(["someProp=someValue"]);
            });
            it('should replace a query attribute if existing', function() {
                var data = {
                    query: ["a=b"]
                };
                urlParser.setOrReplaceQueryAttr(data, 'a', 'c');
                expect(data.query).toEqual(["a=c"]);
            });
        });
    });

});
