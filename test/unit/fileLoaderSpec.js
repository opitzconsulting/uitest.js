describe('fileLoader', function() {
    var fileLoader, global, sniffer, xhr, doneCb;
    beforeEach(function() {
        doneCb = jasmine.createSpy('done');
        xhr = {
            open: jasmine.createSpy('open'),
            send: jasmine.createSpy('send')
        };
        global = {
            XMLHttpRequest: jasmine.createSpy('xhr').andReturn(xhr),
            location: {
                href: 'http://someServer/someBaseUrl'
            }
        };
        sniffer = {};
        fileLoader = uitest.require({
            global: global,
            sniffer: sniffer
        }, ["fileLoader"]).fileLoader;
    });
    function simulateXhrResponse(response) {
        xhr.readyState = 4;
        xhr.status = 200;
        xhr.responseText = response;
        xhr.onreadystatechange();
    }

    function simulateFileXhrResponse(response) {
        xhr.readyState = 4;
        xhr.status = 0;
        xhr.responseText = response;
        xhr.onreadystatechange();
    }
    it('should use an async xhr', function() {
        var url = '/someUrl';
        fileLoader(url, doneCb);
        expect(xhr.open).toHaveBeenCalledWith('GET', url, true);
        expect(xhr.send).toHaveBeenCalled();
    });
    it('should not allow non absolute urls', function() {
        function goodUrl(url) {
            expect(function() {
                fileLoader(url, doneCb);
            }).not.toThrow();
        }
        function badUrl(url) {
            expect(function() {
                fileLoader(url, doneCb);
            }).toThrow();
        }
        badUrl('url');
        badUrl('./url');
        goodUrl('/');
        goodUrl('http://someServer');
    });
    describe('using onreadystatechange', function() {
        it('should return xhr.responseText if the result was 200', function() {
            var someResponse = 'someResponse';
            fileLoader('/someUrl', doneCb);
            xhr.readyState = 4;
            xhr.status = 200;
            xhr.responseText = someResponse;
            xhr.onreadystatechange();
            expect(doneCb).toHaveBeenCalledWith(null, someResponse);
        });
        it('should return xhr.statusText as error if the result was not 200', function() {
            var someStatus = 'someStatus';
            fileLoader('/someUrl', doneCb);
            xhr.readyState = 4;
            xhr.status = 404;
            xhr.statusText = someStatus;
            xhr.onreadystatechange();
            expect(doneCb.mostRecentCall.args[0].message).toBe('Error loading url /someUrl:someStatus');
        });
    });
    describe('using onload/onerror', function() {
        beforeEach(function() {
            xhr.onload = null;
        });
        it('should return xhr.responseText if the result was 200 using onload if available', function() {
            var someResponse = 'someResponse';
            fileLoader('/someUrl', doneCb);
            xhr.status = 200;
            xhr.responseText = someResponse;
            xhr.onload();
            expect(doneCb).toHaveBeenCalledWith(null, someResponse);
        });
        it('should always create an error with onerror ignoring the status code', function() {
            var someStatus = 'someStatus';
            fileLoader('/someUrl', doneCb);
            xhr.status = 200;
            xhr.statusText = someStatus;
            xhr.onerror();
            expect(doneCb.mostRecentCall.args[0].message).toBe('Error loading url /someUrl:someStatus');
        });
    });
    describe('cross origin requests', function() {
        var corsUrl = 'http://someOtherServer/someUrl';
        it('uses XMLHttpRequest if it supports cors', function() {
            xhr.withCredentials = null;
            fileLoader(corsUrl, doneCb);
            expect(global.XMLHttpRequest).toHaveBeenCalled();
        });
        it('uses XDomainRequest otherwise', function() {
            global.XDomainRequest = jasmine.createSpy('xhr').andReturn(xhr);
            fileLoader(corsUrl, doneCb);
            expect(global.XDomainRequest).toHaveBeenCalled();
        });
        it('throws an exception otherwise', function() {
            expect(function() {
                fileLoader(corsUrl, doneCb);
            }).toThrow();
        });
        it('uses www.corsproxy.com as proxy', function() {
            xhr.withCredentials = null;
            fileLoader(corsUrl, doneCb);
            expect(xhr.open).toHaveBeenCalledWith('GET', 'http://www.corsproxy.com/someOtherServer/someUrl', true);
        });
    });

});