uitest.require(["factory!urlLoader"], function(urlLoaderFactory) {
	describe('urlLoader', function() {
		var urlLoader, global, body, iframeElement, uitestwindow;
		beforeEach(function() {
			uitestwindow = {
				location: {},
				close: jasmine.createSpy('close')
			};
			body = {
				appendChild: jasmine.createSpy('appendChild'),
				removeChild: jasmine.createSpy('removeChild'),
				style: {}
			};
			iframeElement = {
				setAttribute: jasmine.createSpy('setAttribute'),
				parentElement: body
			};
			global = {
				document: {
					body: body,
					createElement: jasmine.createSpy('createElement').andReturn(iframeElement)
				},
				frames: {
					uitestwindow: uitestwindow
				},
				open: jasmine.createSpy('open').andReturn(uitestwindow)
			};
			urlLoader = urlLoaderFactory({
				global: global
			});
		});
        describe('navigateWithReloadTo', function () {
            it('should add a new query attribute', function () {
                var win = {
                    location:{}
                };
                urlLoader.navigateWithReloadTo(win, "http://someUrl");
                expect(win.location.href).toBe('http://someUrl?uitr=0');
            });
            it('should replace an existing query attribute', function () {
                var win = {
                    location:{}
                };
                urlLoader.navigateWithReloadTo(win, "http://someUrl");
                expect(win.location.href).toBe('http://someUrl?uitr=0');
            });
        });
        describe('open', function() {
			describe('iframe', function() {
				var config;
				beforeEach(function() {
					config = {
						loadMode: "iframe",
						url: 'someUrl'
					};
				});
				it('should create an iframe on the first call', function() {
					var win = urlLoader.open(config);
					expect(body.appendChild).toHaveBeenCalledWith(iframeElement);
					expect(win).toBe(uitestwindow);
					expect(win.location.href).toBe("someUrl?uitr=0");
				});
				it('should reuse the iframe on the second call', function() {
					urlLoader.open(config);
					body.appendChild.reset();
					var win = urlLoader.open(config);
					expect(body.appendChild).not.toHaveBeenCalled();
					expect(win).toBe(uitestwindow);
					expect(win.location.href).toBe("someUrl?uitr=1");
				});
			});

			describe('popup', function() {
				var config;
				beforeEach(function() {
					config = {
						loadMode: "popup",
						url: 'someUrl'
					};
				});
				it('should create a popup on the first call', function() {
					var win = urlLoader.open(config);
					expect(global.open).toHaveBeenCalledWith('', 'uitestwindow');
					expect(win).toBe(uitestwindow);
					expect(win.location.href).toBe("someUrl?uitr=0");
				});
				it('should reuse the popup on the second call', function() {
					urlLoader.open(config);
					global.open.reset();
					var win = urlLoader.open(config);
					expect(global.open).not.toHaveBeenCalled();
					expect(win).toBe(uitestwindow);
					expect(win.location.href).toBe("someUrl?uitr=1");
				});
			});
		});
		describe('close', function() {
			it('should close a popup only once', function() {
				var config = {
					loadMode: "popup",
					url: 'someUrl'
				};
				urlLoader.open(config);
				urlLoader.close();
				expect(uitestwindow.close).toHaveBeenCalled();

				uitestwindow.close.reset();
				urlLoader.close();
				expect(uitestwindow.close).not.toHaveBeenCalled();
			});
			it('should remove an iframe only once', function() {
				var config = {
					loadMode: "iframe",
					url: 'someUrl'
				};
				urlLoader.open(config);
				urlLoader.close();
				expect(body.removeChild).toHaveBeenCalledWith(iframeElement);

				body.removeChild.reset();
				urlLoader.close();
				expect(body.removeChild).not.toHaveBeenCalled();
			});
		});
	});
});
