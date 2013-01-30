jasmineui.require(["factory!instrumentor"], function (instrumentorFactory) {
    describe("instrumentor", function () {
        var someScriptUrl = 'someScriptUrl';
        var scriptAccessor, instrumentor, globals, XMLHttpRequest, xhr;
        var requireCallback, nestedRequire, someModule, originalRequire, originalRequireLoad;
        beforeEach(function () {
            requireCallback = jasmine.createSpy('requireCallback');
            nestedRequire = jasmine.createSpy('nestedRequire');
            someModule = {};
            originalRequire = jasmine.createSpy('originalRequire');
            originalRequireLoad = jasmine.createSpy('originalRequireLoad');
            originalRequire.load = originalRequireLoad;
            xhr = {
                open:jasmine.createSpy('open'),
                send:jasmine.createSpy('send'),
                status:200
            };
            XMLHttpRequest = function () {
                return xhr;
            };
            globals = {
                XMLHttpRequest:XMLHttpRequest,
                document:{
                    write:jasmine.createSpy('write')
                },
                jasmineui:{},
                eval:function (string) {
                    // Note: These variables are used inside the eval statement!
                    var window = globals;
                    var jasmineui = globals.jasmineui;
                    eval(string);
                }
            };
            scriptAccessor = {
                currentScriptUrl:jasmine.createSpy('scriptAccessor').andReturn(someScriptUrl)
            };
            instrumentor = instrumentorFactory({
                scriptAccessor:scriptAccessor,
                globals:globals
            });
        });

        function initRequire() {
            globals.require = originalRequire;
        }

        function urlScript(url) {
            return '<script type="text/javascript" src="' + url + '"></script>';
        }

        function inlineScript(content) {
            return '<script type="text/javascript">' + content + '</script>';
        }


        describe('loaderScript', function () {
            var win, doc, xhr;

            beforeEach(function () {
                xhr = {
                    open:jasmine.createSpy('open'),
                    send:jasmine.createSpy('send'),
                    responseText:'someText'
                };
                doc = {
                    execCommand:jasmine.createSpy('execCommand'),
                    open:jasmine.createSpy('open'),
                    close:jasmine.createSpy('close'),
                    write:jasmine.createSpy('write')
                };
                win = {
                    location:{
                        href:'someHref'
                    },
                    stop:jasmine.createSpy('stop'),
                    XMLHttpRequest:function () {
                        return xhr;
                    },
                    document:doc
                };
            });

            function execLoader() {
                var script = instrumentor.loaderScript();
                // Used by the eval statement!
                var window = win;
                eval(script);
            }

            describe('stop window load', function () {
                it('should call window.stop if available', function () {
                    execLoader();
                    expect(win.stop).toHaveBeenCalled();
                });
                it('should call document.execCommand if window.stop is not available', function () {
                    delete win.stop;
                    execLoader();
                    expect(doc.execCommand).toHaveBeenCalledWith('Stop');
                });
            });

            describe('document rewrite', function () {
                it('should read the document using xhr', function () {
                    execLoader();
                    expect(xhr.open).toHaveBeenCalledWith('GET', win.location.href, false);
                    expect(xhr.send).toHaveBeenCalled();
                });
                it('should rewrite the document using document.open, document.write and document.close', function () {
                    execLoader();
                    expect(doc.open).toHaveBeenCalled();
                    expect(doc.write).toHaveBeenCalledWith(xhr.responseText);
                    expect(doc.close).toHaveBeenCalled();
                });

                it('should add jasmineuiClient attribute to the html tag', function () {
                    xhr.responseText = '<html>';
                    execLoader();
                    expect(doc.write).toHaveBeenCalledWith('<html data-jasmineui="true">');
                });

                it('should add a script at the end of the body', function () {
                    xhr.responseText = '</body>';
                    execLoader();
                    expect(doc.write).toHaveBeenCalledWith(inlineScript('jasmineui.instrumentor.onEndScripts()') + inlineScript('jasmineui.instrumentor.onEndCalls()') + '</body>');
                });

                it('should replace eval(jasmineui) by the current script url', function () {
                    scriptAccessor.currentScriptUrl.andReturn(someScriptUrl);
                    xhr.responseText = '<script>eval(sessionStorage.jasmineui)</script>';
                    execLoader();
                    expect(doc.write).toHaveBeenCalledWith(urlScript(someScriptUrl));
                });

                it('should replace inline scripts', function () {
                    var someInlineScript = 'someInline+"a"';
                    xhr.responseText = '<script>' + someInlineScript + '</script>';
                    execLoader();
                    var expectedInlineScript = someInlineScript.replace(/"/g, '\\"');
                    expect(doc.write).toHaveBeenCalledWith(inlineScript('jasmineui.instrumentor.onInlineScript("' + expectedInlineScript + '")'));
                });

                it('should replace scripts with urls', function () {
                    var someUrl = 'someUrl';
                    xhr.responseText = '<script src="' + someUrl + '"></script>';
                    execLoader();
                    expect(doc.write).toHaveBeenCalledWith(inlineScript('jasmineui.instrumentor.onUrlScript("' + someUrl + '")'));
                });
            });
        });

        describe('jasmineui.instrumentor.onInlineScript', function () {
            it('should eval the original content in the global scope', function () {
                globals.jasmineui.instrumentor.onInlineScript('window.test=3');
                expect(globals.test).toBe(3);
            });
            it('should be able to instrument functions', function () {
                var called;
                globals.jasmineui.instrumentFunction('someFn', function () {
                    called = true;
                });
                globals.jasmineui.instrumentor.onInlineScript('function someFn() { }; someFn();');
                expect(called).toBe(true);
            });
        });

        describe('jasmineui.instrumentor.onUrlScript', function () {
            it('should create a script tag if no instrumentation is needed', function () {
                instrumentor.setInstrumentUrlPatterns(['someUrl2']);
                globals.jasmineui.instrumentor.onUrlScript('someUrl');
                expect(globals.document.write).toHaveBeenCalledWith('<script type="text/javascript" src="someUrl"></script>');
            });
            it('should load the script with xhr, eval and instrument it', function () {
                instrumentor.setInstrumentUrlPatterns(['.*']);
                var called;
                globals.jasmineui.instrumentFunction('someFn', function () {
                    called = true;
                });

                globals.jasmineui.instrumentor.onUrlScript('someUrl');
                expect(globals.document.write).not.toHaveBeenCalled();
                expect(xhr.open).toHaveBeenCalledWith('GET', 'someUrl', true);
                expect(xhr.send).toHaveBeenCalled();
                xhr.responseText = 'function someFn() { }; someFn();'
                xhr.readyState = 4;
                xhr.onreadystatechange();
                expect(called).toBe(true);
            });
            it('should throw an error if the xhr failed', function () {
                instrumentor.setInstrumentUrlPatterns(['.*']);
                globals.jasmineui.instrumentor.onUrlScript('someUrl');
                expect(globals.document.write).not.toHaveBeenCalled();
                xhr.readyState = 4;
                xhr.status = 500;
                xhr.statusText = 'someError';
                try {
                    xhr.onreadystatechange();
                    throw new Error("should not be reached");
                } catch (e) {
                    expect(e.message).toBe('Error loading url someUrl:someError');
                }
            });
        });

        describe('beginScript', function () {
            it('should add the script using document.write', function () {
                var someUrl = 'someUrl';
                instrumentor.beginScript(someUrl);
                expect(globals.document.write).toHaveBeenCalledWith(urlScript(someUrl));
            });
        });

        describe('endScript', function () {
            describe('no script loader', function () {
                it('should add the script when jasmineui.instrumentor.onEndScripts() is called', function () {
                    var someUrl = 'someUrl';
                    instrumentor.endScript(someUrl);
                    globals.jasmineui.instrumentor.onEndScripts();
                    expect(globals.document.write).toHaveBeenCalledWith(urlScript(someUrl));
                });
            });
            describe('with requirejs', function () {
                beforeEach(initRequire);
                it('should not call document.write', function () {
                    var someScriptUrl = "someScriptUrl";
                    instrumentor.endScript(someScriptUrl);
                    globals.jasmineui.instrumentor.onEndScripts();
                    expect(globals.document.write).not.toHaveBeenCalled();
                });

                it('should add the script to the nested require call', function () {
                    var someScriptUrl = "someScriptUrl";
                    instrumentor.endScript(someScriptUrl);
                    globals.jasmineui.instrumentor.onEndScripts();

                    globals.require(['someModule'], requireCallback);

                    originalRequire.mostRecentCall.args[1](someModule, nestedRequire);
                    expect(nestedRequire.mostRecentCall.args[0]).toEqual([someScriptUrl]);
                });
            });
        });

        describe('endCall', function () {
            describe('no script loader', function () {
                it('should call the given function when jasmineui.instrumentor.onEndCalls() is called', function () {
                    var callback = jasmine.createSpy('callback');
                    instrumentor.endCall(callback);
                    globals.jasmineui.instrumentor.onEndCalls();
                    expect(callback).toHaveBeenCalled();
                });
            });
            describe('with requirejs', function () {
                beforeEach(initRequire);
                it('should call the callbacks when the nested require call is called', function () {
                    var endCallback = jasmine.createSpy('endCallback');
                    instrumentor.endCall(endCallback);

                    globals.jasmineui.instrumentor.onEndScripts();
                    globals.require(['someModule'], requireCallback);

                    originalRequire.mostRecentCall.args[1](someModule, nestedRequire);
                    expect(endCallback).not.toHaveBeenCalled();
                    nestedRequire.mostRecentCall.args[1]();
                    expect(endCallback).toHaveBeenCalled();
                });
            });
        });

        describe('requirejs', function () {
            beforeEach(initRequire);
            it('should instrument require to do a nested require', function () {
                globals.jasmineui.instrumentor.onEndScripts();
                globals.require(['someModule'], requireCallback);

                expect(originalRequire).toHaveBeenCalled();
                expect(originalRequire.mostRecentCall.args[0]).toEqual(['someModule', 'require']);
                expect(requireCallback).not.toHaveBeenCalled();

                originalRequire.mostRecentCall.args[1](someModule, nestedRequire);
                expect(nestedRequire).toHaveBeenCalled();
            });

            it('should call the original require callback when the nested callback is called with the original arguments', function () {
                globals.jasmineui.instrumentor.onEndScripts();
                globals.require(['someModule'], requireCallback);

                originalRequire.mostRecentCall.args[1](someModule, nestedRequire);

                nestedRequire.mostRecentCall.args[1]();
                expect(requireCallback).toHaveBeenCalledWith(someModule);
            });

            it('should call the original require.onload if a module is not instrumented', function() {
                globals.jasmineui.instrumentor.onEndScripts();
                instrumentor.setInstrumentUrlPatterns(['someUrl2']);
                originalRequire.load('someContext', 'someModule', 'someUrl');
                expect(originalRequireLoad).toHaveBeenCalledWith('someContext', 'someModule', 'someUrl');
            });

            it('should laod the script with xhr, eval and instrument it', function() {
                var called;
                var completeLoad = jasmine.createSpy('completeLoad');
                instrumentor.setInstrumentUrlPatterns(['.*']);
                globals.jasmineui.instrumentFunction('someFn', function () {
                    called = true;
                });
                globals.jasmineui.instrumentor.onEndScripts();

                originalRequire.load({completeLoad: completeLoad}, 'someModule', 'someUrl');
                expect(originalRequireLoad).not.toHaveBeenCalled();

                expect(xhr.open).toHaveBeenCalledWith('GET', 'someUrl', true);
                expect(xhr.send).toHaveBeenCalled();
                xhr.responseText = 'function someFn() { }; someFn();'
                xhr.readyState = 4;
                xhr.onreadystatechange();
                expect(called).toBe(true);
                expect(completeLoad).toHaveBeenCalledWith('someModule');
            });

            it('should throw an error if the xhr failed and set the error flag in the module context', function () {
                instrumentor.setInstrumentUrlPatterns(['.*']);
                globals.jasmineui.instrumentor.onEndScripts();
                var context = {
                    registry: {
                        someModule: {}
                    }
                };
                originalRequire.load(context, 'someModule', 'someUrl');

                xhr.readyState = 4;
                xhr.status = 500;
                xhr.statusText = 'someError';
                try {
                    xhr.onreadystatechange();
                    throw new Error("should not be reached");
                } catch (e) {
                    expect(e.message).toBe('Error loading url someUrl:someError');
                }
                expect(context.registry.someModule.error).toBe(true);
            });

        });

        describe('instrumentFunction', function () {
            it('should get the function name, the function, this and the original arguments as arguments', function () {
                var args;
                globals.jasmineui.instrumentFunction('someFn', function (fnName, fn, self, originalArgs) {
                    args = arguments;
                });
                globals.self = {};
                globals.jasmineui.instrumentor.onInlineScript('function someFn(a) { return a+1; }; someFn.call(window.self, 2);');
                expect(args[0]).toEqual('someFn');
                expect(args[2]).toEqual(globals.self);
                expect(args[3]).toEqual([2]);
            });
            it('should be able to delegate to the original function', function () {
                globals.jasmineui.instrumentFunction('someFn', function (fnName, fn, self, originalArgs) {
                    return fn.apply(self, originalArgs) + 1;
                });
                globals.jasmineui.instrumentor.onInlineScript('function someFn(a) { return a+1; }; window.result = someFn(2);');
                expect(globals.result).toBe(4);
            });
            it('should be able to replace to the original function', function () {
                globals.jasmineui.instrumentFunction('someFn', function (fnName, fn, self, originalArgs) {
                    return -1;
                });
                globals.jasmineui.instrumentor.onInlineScript('function someFn(a) { return a+1; }; window.result = someFn(2);');
                expect(globals.result).toBe(-1);
            });
            it('should be able to replace a function when we have multiple function definitions', function() {
                globals.jasmineui.instrumentFunction('someFn', function (fnName, fn, self, originalArgs) {
                    return -1;
                });
                globals.jasmineui.instrumentor.onInlineScript('function test1() { }; function someFn(a) { return a+1; }; window.result = someFn(2);');
                expect(globals.result).toBe(-1);

            });
            it('should be able to replace functions in multi line scripts', function() {
                globals.jasmineui.instrumentFunction('someFn', function (fnName, fn, self, originalArgs) {
                    return -1;
                });
                globals.jasmineui.instrumentor.onInlineScript('function test1() { }; \nfunction someFn(a) { return a+1; }; window.result = someFn(2);');
                expect(globals.result).toBe(-1);

            });
        });
    });
});

