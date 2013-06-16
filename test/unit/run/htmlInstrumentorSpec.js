describe('run/htmlInstrumentor', function() {
    var instrumentor, eventSource, fileLoader, runConfig, global, testframe, testwin, injector, someUrl, resultCb, utils;
    beforeEach(function() {
        someUrl = '/someBase/someUrl';
        resultCb = jasmine.createSpy('resultCb');
        testwin = {};
        testframe = {
            createRemoteCallExpression: jasmine.createSpy('createRemoteCallExpression'),
            win: jasmine.createSpy('win').andReturn(testwin)
        };
        global = {
            Object: Object
        };
        runConfig = {};
        fileLoader = jasmine.createSpy('fileLoader');
        var modules = uitest.require({
            'run/testframe': testframe,
            global: global,
            fileLoader: fileLoader,
            'run/config': runConfig
        }, ["run/htmlInstrumentor", "run/eventSource", "run/injector", "utils"]);
        instrumentor = modules["run/htmlInstrumentor"];
        eventSource = modules["run/eventSource"];
        injector = modules["run/injector"];
        utils = modules.utils;
        injector.addDefaultResolver(testwin);
    });
    function processHtml(html) {
        html = html || '<html><head></head><body></body></html>';
        instrumentor.processHtml(someUrl, resultCb);
        fileLoader.mostRecentCall.args[1](null, html);
    }
    describe('processHtml', function() {
        it('should load the given file', function() {
            instrumentor.processHtml(someUrl, resultCb);
            expect(fileLoader).toHaveBeenCalled();
            expect(fileLoader.mostRecentCall.args[0]).toBe(someUrl);
        });
        it('should forward errors from file loading', function() {
            var someError = {};
            instrumentor.processHtml(someUrl, resultCb);
            fileLoader.mostRecentCall.args[1](someError);
            expect(resultCb).toHaveBeenCalledWith(someError);
        });
        it('should process html using the eventSource and html: event prefixes', function() {
            var eventCb = jasmine.createSpy('event');
            eventSource.on('html:head:start', eventCb);
            processHtml();
            expect(eventCb.mostRecentCall.args[0].token.name).toBe('head');
        });
        it('should return the transformed html', function() {
            var eventCb = jasmine.createSpy('event');
            eventSource.on('html:head:start', eventCb);
            processHtml();
            expect(resultCb).not.toHaveBeenCalled();
            eventCb.mostRecentCall.args[0].append.push('someText');
            eventCb.mostRecentCall.args[1]();
            expect(resultCb).toHaveBeenCalledWith(undefined, '<html><head>someText</head><body></body></html>');
        });
    });

    describe('add prepends', function() {
        it('should forward errors', function() {
            var someError = {};
            eventSource.on('addPrepends', addPrepends);
            processHtml();
            expect(resultCb).toHaveBeenCalledWith(someError, '<html>');

            function addPrepends(event, done) {
                done(someError);
            }
        });
        it('should add url prepends after <head>', function() {
            eventSource.on('addPrepends', addPrepends);
            processHtml('<html><head>someHead</head><body></body></html>');
            expect(resultCb).toHaveBeenCalledWith(undefined, '<html><head><script src="/someBase/someScript.js"></script>someHead</head><body></body></html>');

            function addPrepends(event, done) {
                event.handlers.push('someScript.js');
                done();
            }
        });
        it('should add url prepends after <body> if no <head> exists', function() {
            eventSource.on('addPrepends', addPrepends);
            processHtml('<html><body>someBody</body></html>');
            expect(resultCb).toHaveBeenCalledWith(undefined, '<html><body><script src="/someBase/someScript.js"></script>someBody</body></html>');

            function addPrepends(event, done) {
                event.handlers.push('someScript.js');
                done();
            }
        });
        it('should add function callbacks after <head>', function() {
            var prepend = jasmine.createSpy('prepend');
            eventSource.on('addPrepends', addPrepends);
            testframe.createRemoteCallExpression.andReturn('someRemoteCb');
            processHtml('<html><head>someHead</head></html>');
            expect(resultCb).toHaveBeenCalledWith(undefined, '<html><head><script>someRemoteCb</script>someHead</head></html>');

            function addPrepends(event, done) {
                event.handlers.push(prepend);
                done();
            }
        });

        it('should call function callbacks with dependency injection', function() {
            var capturedSomeArg;
            eventSource.on('addPrepends', addPrepends);
            testwin.someArg = 'someValue';
            processHtml();
            expect(capturedSomeArg).toBeUndefined();
            testframe.createRemoteCallExpression.mostRecentCall.args[0]();
            expect(capturedSomeArg).toBe(testwin.someArg);

            function addPrepends(event, done) {
                event.handlers.push(prepend);
                done();
            }

            function prepend(someArg) {
                capturedSomeArg = someArg;
            }
        });
        it('should group multiple function callbacks into one script tag', function() {
            var prepend = jasmine.createSpy('prepend');
            eventSource.on('addPrepends', addPrepends);
            processHtml();
            testframe.createRemoteCallExpression.mostRecentCall.args[0]();
            expect(prepend.callCount).toBe(2);

            function addPrepends(event, done) {
                event.handlers.push(prepend);
                event.handlers.push(prepend);
                done();
            }
        });
    });
    describe('add appends', function() {
        it('should forward errors', function() {
            var someError = {};
            eventSource.on('addAppends', addAppends);
            processHtml();
            expect(resultCb).toHaveBeenCalledWith(someError, '<html><head></head><body>');

            function addAppends(event, done) {
                done(someError);
            }
        });
        it('should add url appends before <body>', function() {
            eventSource.on('addAppends', addAppends);
            processHtml('<html><body>someBody</body></html>');
            expect(resultCb).toHaveBeenCalledWith(undefined, '<html><body>someBody<script src="/someBase/someScript.js"></script></body></html>');

            function addAppends(event, done) {
                event.handlers.push('someScript.js');
                done();
            }
        });
        it('should call function callbacks with dependency injection', function() {
            var capturedSomeArg;
            eventSource.on('addAppends', addAppends);
            testwin.someArg = 'someValue';
            processHtml();
            expect(capturedSomeArg).toBeUndefined();
            testframe.createRemoteCallExpression.mostRecentCall.args[0]();
            expect(capturedSomeArg).toBe(testwin.someArg);

            function addAppends(event, done) {
                event.handlers.push(append);
                done();
            }

            function append(someArg) {
                capturedSomeArg = someArg;
            }
        });
        it('should group multiple function callbacks into one script tag', function() {
            var append = jasmine.createSpy('append');
            eventSource.on('addAppends', addAppends);
            processHtml();
            testframe.createRemoteCallExpression.mostRecentCall.args[0]();
            expect(append.callCount).toBe(2);

            function addAppends(event, done) {
                event.handlers.push(append);
                event.handlers.push(append);
                done();
            }
        });
    });

    describe('instrumentScript event', function() {
        describe('url scripts', function() {
            var htmlWithUrlScript = '<html><head><script a="1" src="someScript.js" b="2"></script></head></html>';
            it('should forward errors', function() {
                var someError = {};
                eventSource.on("instrumentScript", instrumentScript);
                processHtml(htmlWithUrlScript);
                expect(resultCb).toHaveBeenCalledWith(someError, '<html><head>');

                function instrumentScript(event, done) {
                    done(someError);
                }
            });
            it('should trigger the event', function() {
                var insrumentHandler = jasmine.createSpy('insrumentHandler');
                eventSource.on("instrumentScript", insrumentHandler);
                processHtml(htmlWithUrlScript);
                var instrumentScriptEvent = insrumentHandler.mostRecentCall.args[0];
                expect(instrumentScriptEvent.content).toBeUndefined();
                expect(instrumentScriptEvent.src).toBe('/someBase/someScript.js');
                expect(instrumentScriptEvent.changed).toBe(false);
            });
            it('should use an updated url from the event', function() {
                eventSource.on("instrumentScript", instrumentScript);
                processHtml(htmlWithUrlScript);
                expect(resultCb).toHaveBeenCalledWith(undefined, '<html><head><script a="1" src="someNewUrl.js" b="2"></script></head></html>');

                function instrumentScript(event, done) {
                    event.src = 'someNewUrl.js';
                    done();
                }
            });
            it('should convert the script into a content script if the changed flag is set, keeping all attributes', function() {
                spyOn(utils, 'evalScript');
                eventSource.on("instrumentScript", instrumentScript);
                testframe.createRemoteCallExpression.andReturn('someRemoteScript');
                processHtml(htmlWithUrlScript);
                expect(resultCb).toHaveBeenCalledWith(undefined, '<html><head><script a="1" b="2">someRemoteScript</script></head></html>');
                testframe.createRemoteCallExpression.mostRecentCall.args[0]();
                expect(utils.evalScript).toHaveBeenCalledWith(testwin, '/someBase/someScript.js', 'newContent');

                function instrumentScript(event, done) {
                    event.changed = true;
                    event.content = 'newContent';
                    done();
                }
            });
            it('should instrument url scripts added by addAppends', function() {
                var instrumentScript = jasmine.createSpy('instrumentScript');
                eventSource.on("addAppends", addAppends);
                eventSource.on("instrumentScript", instrumentScript);
                processHtml('<html><body></body></html>');
                expect(instrumentScript.mostRecentCall.args[0].src).toBe('/someBase/someAppendScript.js');

                function addAppends(event, done) {
                    event.handlers.push('someAppendScript.js');
                    done();
                }
            });
        });
        describe('content scripts', function() {
            var htmlWithContentScript = '<html><head><script a="1">someScriptContent</script></head></html>';
            it('should forward errors', function() {
                var someError = {};
                eventSource.on("instrumentScript", instrumentScript);
                processHtml(htmlWithContentScript);
                expect(resultCb).toHaveBeenCalledWith(someError, '<html><head>');

                function instrumentScript(event, done) {
                    done(someError);
                }
            });
            it('should trigger the event', function() {
                var insrumentHandler = jasmine.createSpy('insrumentHandler');
                eventSource.on("instrumentScript", insrumentHandler);
                processHtml(htmlWithContentScript);
                var instrumentScriptEvent = insrumentHandler.mostRecentCall.args[0];
                expect(instrumentScriptEvent.content).toBe('someScriptContent');
                expect(instrumentScriptEvent.src).toBeUndefined();
                expect(instrumentScriptEvent.changed).toBe(false);
            });
            it('should convert the script into a content script if the changed flag is set, keeping all attributes', function() {
                spyOn(utils, 'evalScript');
                eventSource.on("instrumentScript", instrumentScript);
                testframe.createRemoteCallExpression.andReturn('someRemoteScript');
                processHtml(htmlWithContentScript);
                expect(resultCb).toHaveBeenCalledWith(undefined, '<html><head><script a="1">someRemoteScript</script></head></html>');
                testframe.createRemoteCallExpression.mostRecentCall.args[0]();
                expect(utils.evalScript).toHaveBeenCalledWith(testwin, undefined, 'newContent');

                function instrumentScript(event, done) {
                    event.changed = true;
                    event.content = 'newContent';
                    done();
                }
            });
            it('should instrument content scripts added by addAppends', function() {
                var instrumentScript = jasmine.createSpy('instrumentScript'),
                    someAppend = jasmine.createSpy('someAppend');
                testframe.createRemoteCallExpression.andReturn('someRemoteScript');
                eventSource.on("addAppends", addAppends);
                eventSource.on("instrumentScript", instrumentScript);
                processHtml('<html><body></body></html>');
                expect(instrumentScript.mostRecentCall.args[0].content).toBe('someRemoteScript');

                function addAppends(event, done) {
                    event.handlers.push(someAppend);
                    done();
                }
            });
        });
    });
});