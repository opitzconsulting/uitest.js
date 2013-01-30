jasmineui.require(['factory!urlParser'], function (urlParserFactory) {

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

        describe('makeAbsoluteUrl', function () {
            describe('absolute paths', function() {
                it("should not modify urls with hostname and protocol", function () {
                    var someUrl = 'http://asdf';
                    expect(urlParser.makeAbsoluteUrl('someBaseUrl', someUrl)).toBe(someUrl);
                });
                it("should not modify urls with slash prefix", function () {
                    var someUrl = '/asdf';
                    expect(urlParser.makeAbsoluteUrl('someBaseUrl', someUrl)).toBe(someUrl);
                });
            });
            describe('relative urls', function() {
                it('should do nothing if no baseUrl is given', function() {
                    expect(urlParser.makeAbsoluteUrl(undefined, 'someRelativeUrl')).toBe('someRelativeUrl');
                });
                it("should make urls absolute by adding the path of the baseUrl if baseUrl is a file", function () {
                    expect(urlParser.makeAbsoluteUrl('someBaseUrl/someScript.js', 'someRelativeUrl')).toBe('someBaseUrl/someRelativeUrl');
                });
                it("should make urls absolute by adding the path of the baseUrl if baseUrl is a folder", function () {
                    expect(urlParser.makeAbsoluteUrl('someBaseUrl/', 'someRelativeUrl')).toBe('someBaseUrl/someRelativeUrl');
                });
                it("should make urls absolute by adding the path of the baseUrl with baseUrls that contain more than 2 slashes", function () {
                    expect(urlParser.makeAbsoluteUrl('someBaseUrl/someDir/someScript.js', 'someRelativeUrl')).toBe('someBaseUrl/someDir/someRelativeUrl');
                });
            });
        });
    });

});
