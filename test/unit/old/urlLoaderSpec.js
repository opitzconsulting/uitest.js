jasmineui.require(['factory!urlLoader'], function (urlLoaderFactory) {

    describe("urlLoader", function () {
        var urlLoader, persistentDataAccessor, persistentData, config, saveDataToWindow;
        var openedWindow, openedFrame, globals, xhr;

        beforeEach(function () {
            xhr = {
                status:200,
                open:jasmine.createSpy('open'),
                send:jasmine.createSpy('send')
            };
            openedWindow = {
                close:jasmine.createSpy('close'),
                location:{}
            };
            openedFrame = {
                element:{
                    setAttribute:jasmine.createSpy('setAttribute'),
                    parentElement:{
                        removeChild:jasmine.createSpy('removeChild')
                    }
                },
                object:{
                    location:{}
                }
            };
            globals = {
                open:jasmine.createSpy('open').andReturn(openedWindow),
                frames:{
                    'jasmineui-testwindow':openedFrame.object
                },
                document:{
                    createElement:jasmine.createSpy('createElement').andReturn(openedFrame.element),
                    body:{
                        appendChild:jasmine.createSpy('appendChild')
                    }
                },
                XMLHttpRequest:function () {
                    return xhr;
                }
            };
            persistentData = {};
            persistentDataAccessor = function () {
                return persistentData;
            };
            saveDataToWindow = jasmine.createSpy('saveDataToWindow');
            persistentDataAccessor.saveDataToWindow = saveDataToWindow;
            config = {};
            urlLoader = urlLoaderFactory({
                persistentData:persistentDataAccessor,
                config:config,
                globals:globals
            });
        });

        describe('navigateWithReloadTo', function () {
            it('should add a new query attribute', function () {
                var win = {
                    location:{}
                };
                urlLoader.navigateWithReloadTo(win, "http://someUrl");
                expect(win.location.href).toBe('http://someUrl?juir=1');
                expect(persistentData.refreshCount).toBe(1);
            });
            it('should replace an existing query attribute', function () {
                persistentData.refreshCount = 2;
                var win = {
                    location:{}
                };
                urlLoader.navigateWithReloadTo(win, "http://someUrl");
                expect(win.location.href).toBe('http://someUrl?juir=3');
                expect(persistentData.refreshCount).toBe(3);
            });
            it('should call persistentData.saveDataToWindow', function () {
                var win = {
                    location:{}
                };
                urlLoader.navigateWithReloadTo(win, "http://someUrl");
                expect(persistentDataAccessor.saveDataToWindow).toHaveBeenCalledWith(win);
            });
        });

        describe('openTestWindow', function () {
            describe('popup mode', function () {
                beforeEach(function () {
                    config.loadMode = 'popup';
                });
                it('should use window.open on the first call and return it', function () {
                    var someUrl = 'someUrl';
                    var win = urlLoader.openTestWindow(someUrl);
                    expect(globals.open).toHaveBeenCalledWith(someUrl, 'jasmineui-testwindow');
                    expect(saveDataToWindow).toHaveBeenCalledWith(openedWindow);
                });
                it('should reuse an existing open window', function () {
                    urlLoader.openTestWindow('someUrl');
                    globals.open.reset();
                    var win = urlLoader.openTestWindow('someUrl2');
                    expect(globals.open).not.toHaveBeenCalled();
                    expect(win.location.href).toBe('someUrl2?juir=1');
                });
            });

            describe('iframe mode', function () {
                var somePage = 'somePage.html';
                beforeEach(function () {
                    config.loadMode = "iframe";
                });
                it('should use an iframe and add it to the document body', function () {
                    urlLoader.openTestWindow(somePage);
                    expect(globals.document.createElement).toHaveBeenCalledWith('iframe');
                    expect(openedFrame.element.name).toBe('jasmineui-testwindow');
                    expect(openedFrame.element.setAttribute).toHaveBeenCalledWith('src', somePage);
                    expect(globals.document.body.appendChild).toHaveBeenCalledWith(openedFrame.element);
                    expect(saveDataToWindow).toHaveBeenCalledWith(openedFrame.object);
                });
                it('should reuse an existing open iframe', function () {
                    var win = urlLoader.openTestWindow('someUrl');
                    globals.document.createElement.reset();
                    urlLoader.openTestWindow('someUrl2');
                    expect(globals.document.createElement).not.toHaveBeenCalled();
                    expect(win.location.href).toBe('someUrl2?juir=1');
                });
            });
        });

        describe('closeTestWindow', function () {
            describe('popup mode', function () {
                beforeEach(function () {
                    config.loadMode = 'popup';
                    urlLoader.openTestWindow('someUrl');
                });
                it('should close the window if config.closeTestWindow=true', function () {
                    config.closeTestWindow = true;
                    urlLoader.closeTestWindow();
                    expect(openedWindow.close).toHaveBeenCalled();
                });
                it('should not close the window if specs are finished and config.closeTestWindow=false', function () {
                    config.closeTestWindow = false;
                    urlLoader.closeTestWindow();
                    expect(openedWindow.close).not.toHaveBeenCalled();
                });
            });
            describe('iframe mode', function () {
                beforeEach(function () {
                    config.loadMode = 'iframe';
                    urlLoader.openTestWindow('someUrl');
                });
                it('should remove the iframe if config.closeTestWindow=true', function () {
                    config.closeTestWindow = true;
                    urlLoader.closeTestWindow();
                    expect(openedFrame.element.parentElement.removeChild).toHaveBeenCalled();
                });
                it('should not remove the iframe if config.closeTestWindow=false', function () {
                    config.closeTestWindow = false;
                    urlLoader.closeTestWindow();
                    expect(openedFrame.element.parentElement.removeChild).not.toHaveBeenCalled();
                });
            });
        });

        describe('checkAndNormalizeUrl', function() {
            it('should make relative urls absolute', function() {
                config.baseUrl = '/base/jasmineui.js';
                expect(urlLoader.checkAndNormalizeUrl('someUrl')).toBe('/base/someUrl');
            });
            it('should throw an error if the url cannot be loaded using xhr', function() {
                config.baseUrl = '/base/jasmineui.js';
                xhr.status = 500;
                try {
                    urlLoader.checkAndNormalizeUrl('someUrl.html');
                    throw new Error("expected an error");
                } catch (e) {
                    // expected
                }
                expect(xhr.open).toHaveBeenCalledWith('GET', '/base/someUrl.html', false);
            });
        });
    });
});
