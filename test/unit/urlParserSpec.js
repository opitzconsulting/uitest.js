describe("urlParser", function () {
    var urlParser, global;
    beforeEach(function () {
        global = {
            document: {
                getElementsByTagName: jasmine.createSpy('getElementsByTagName').andReturn([{
                    src: 'uitest.js'
                }])
            }
        };
        urlParser = uitest.require({
            global: global
        },["urlParser"]
        ).urlParser;
    });

    describe('parseUrl and serializeUrl', function () {
        it('should parse and serialize complete urls', function () {
            var someUrl = 'http://host/path#someHash';
            var actualUrl = urlParser.parseUrl(someUrl);
            expect(actualUrl).toEqual({
                protocol:'http',
                domain:'host',
                path:'/path',
                query:[  ],
                hash:'someHash'
            });
            expect(urlParser.serializeUrl(actualUrl)).toEqual(someUrl);
        });
        it('should parse urls with existing empty hash', function() {
            var someUrl = 'http://host/path?someQuery#';
            var actualUrl = urlParser.parseUrl(someUrl);
            expect(actualUrl).toEqual({
                protocol:'http',
                domain:'host',
                path:'/path',
                query:[ 'someQuery' ],
                hash:''
            });
            expect(urlParser.serializeUrl(actualUrl)).toEqual(someUrl);
        });
        it('should parse urls without a hash', function() {
            var someUrl = 'http://host/path';
            var actualUrl = urlParser.parseUrl(someUrl);
            expect(actualUrl).toEqual({
                protocol:'http',
                domain:'host',
                path:'/path',
                query:[  ],
                hash:undefined
            });
            expect(urlParser.serializeUrl(actualUrl)).toEqual(someUrl);
        });
        it('should parse urls with multiple query parts', function () {
            var someUrl = 'http://host/path?a=b&c';
            var actualUrl = urlParser.parseUrl(someUrl);
            expect(actualUrl).toEqual({
                protocol:'http',
                domain:'host',
                path:'/path',
                query:[ "a=b", "c" ],
                hash:undefined
            });
            expect(urlParser.serializeUrl(actualUrl)).toBe(someUrl);
        });
        it('should parse urls without protocol', function() {
            var someUrl = '//host/path';
            var actualUrl = urlParser.parseUrl(someUrl);
            expect(actualUrl).toEqual({
                protocol:'',
                domain:'host',
                path:'/path',
                query:[ ],
                hash:undefined
            });
            expect(urlParser.serializeUrl(actualUrl)).toBe(someUrl);
        });
        it('should parse urls without protocol and domain', function() {
            var someUrl = '/path';
            var actualUrl = urlParser.parseUrl(someUrl);
            expect(actualUrl).toEqual({
                protocol:'',
                domain:'',
                path:'/path',
                query:[ ],
                hash:undefined
            });
            expect(urlParser.serializeUrl(actualUrl)).toBe(someUrl);
        });
    });

    describe('makeAbsoluteUrl', function() {
        it('should not change urls with a leading slash', function() {
            expect(urlParser.makeAbsoluteUrl('/someUrl', 'base')).toBe('/someUrl');
        });
        it('should not change urls with a protocol', function() {
            expect(urlParser.makeAbsoluteUrl('http://someUrl', 'base')).toBe('http://someUrl');
        });
        it('should change relative change urls with a base that contains no slash', function() {
            expect(urlParser.makeAbsoluteUrl('someUrl', 'base')).toBe('/someUrl');
        });
        it('should change relative change urls with a base that contains a single slash', function() {
            expect(urlParser.makeAbsoluteUrl('someUrl', '/base')).toBe('/someUrl');
        });
        it('should change relative change urls with a base that contains two or more slashes', function() {
            expect(urlParser.makeAbsoluteUrl('someUrl', '/base/file')).toBe('/base/someUrl');
        });
        it('should work with a base url that contains a slash in the hash', function() {
            expect(urlParser.makeAbsoluteUrl('someUrl', '/base/file#/someHash')).toBe('/base/someUrl');
        });
    });

    describe('filenameFor', function() {
        it('returns the filename for urls without path', function() {
            expect(urlParser.filenameFor('someFile')).toBe('someFile');
        });
        it('returns the filename for urls with path', function() {
            expect(urlParser.filenameFor('somePath/someFile')).toBe('someFile');
        });
        it('returns the filename for urls with query', function() {
            expect(urlParser.filenameFor('somePath/someFile?query')).toBe('someFile');
        });
        it('returns the filename for urls with hash', function() {
            expect(urlParser.filenameFor('somePath/someFile#hash')).toBe('someFile');
        });
        it('returns the filename for urls with hash that contain slashes', function() {
            expect(urlParser.filenameFor('somePath/someFile#/hash')).toBe('someFile');
        });
    });

    describe('uitestUrl', function() {
        function test(someUrl, shouldMatch) {
            global.document.getElementsByTagName.andReturn([{src: someUrl}]);
            if (shouldMatch) {
                expect(urlParser.uitestUrl()).toBe(someUrl);
            } else {
                expect(function() {
                    urlParser.uitestUrl();
                }).toThrow();
            }
        }

        it('should use the right regex', function() {
            test('uitest.js', true);
            test('uitest-v1.0.js', true);
            test('uitestutils.js', false);
            test('uitest/some.js', false);
            test('uitest.js/some.js', false);
        });
    });

    describe('cacheBustingUrl', function() {
        it('should add a query parameter for empty urls', function() {
            expect(urlParser.cacheBustingUrl('someUrl', 123)).toBe('someUrl?123');
        });
        it('should add a query parameter for urls with query', function() {
            expect(urlParser.cacheBustingUrl('someUrl?a', 123)).toBe('someUrl?a&123');
        });
        it('should replace an existing timestamp in the query', function() {
            expect(urlParser.cacheBustingUrl('someUrl?123&b', 3)).toBe('someUrl?3&b');
        });
    });
});
