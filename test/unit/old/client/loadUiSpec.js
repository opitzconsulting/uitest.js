jasmineui.require(["factory!client/loadUi"], function (loadUiFactory) {
    describe("client/loadUi", function () {
        var persistentData, persistentDataAccessor, globals, clientTestAdapter, urlLoader, scriptAccessor, instrumentor, config, asyncSensor;
        var saveDataToWindow, executeTest;
        var loadUi;
        beforeEach(function () {
            instrumentor = {
                beginScript:jasmine.createSpy('beginScript'),
                endScript:jasmine.createSpy('endScript')
            };
            config = {
                scripts:[]
            };
            persistentData = {
                globalErrors:[],
                specs:[],
                analyzeScripts:[]
            };
            saveDataToWindow = jasmine.createSpy('saveDataToWindow');
            persistentDataAccessor = function () {
                return persistentData;
            };
            persistentDataAccessor.saveDataToWindow = saveDataToWindow;
            scriptAccessor = {
                currentScriptUrl:jasmine.createSpy('currentScriptUrl')
            };
            globals = {
                addEventListener:jasmine.createSpy('addEventListener'),
                jasmineui:{}
            };
            urlLoader = {
                navigateWithReloadTo:jasmine.createSpy('navigateWithReloadTo')
            };
            executeTest = jasmine.createSpy('executeTest');
            clientTestAdapter = {
                listSpecIds:jasmine.createSpy('listSpecIds').andReturn([]),
                initSpecRun:jasmine.createSpy('initSpecRun'),
                executeSpecRun:executeTest
            };
            asyncSensor = {
                afterAsync:jasmine.createSpy('afterAsync')
            };
        });

        function createLoadUi() {
            loadUi = loadUiFactory({
                persistentData:persistentDataAccessor,
                globals:globals,
                'client/testAdapter':clientTestAdapter,
                urlLoader:urlLoader,
                scriptAccessor:scriptAccessor,
                instrumentor:instrumentor,
                config:config,
                'client/asyncSensor':asyncSensor
            });
        }

        describe('analyze phase', function () {
            beforeEach(function () {
                persistentData.specIndex = -1;
            });
            it('should add the util scripts', function () {
                config.scripts = [
                    {
                        position:'begin',
                        url:'beginScript.js'
                    },
                    {
                        position:'end',
                        url:'endScript.js'
                    }
                ];
                createLoadUi();
                expect(instrumentor.beginScript).toHaveBeenCalledWith('beginScript.js');
                expect(instrumentor.endScript).toHaveBeenCalledWith('endScript.js');
            });
            it('should add the analyze scripts', function () {
                persistentData.analyzeScripts = ['someScript.js'];
                createLoadUi();
                expect(instrumentor.beginScript).toHaveBeenCalledWith('someScript.js');
            });
            it('should save global errors into persistentData.globalErrors', function () {
                createLoadUi();
                globals.addEventListener.mostRecentCall.args[1]({message:'someError'});
                expect(persistentData.globalErrors).toEqual([
                    { message:'someError' }
                ]);
            });

            describe('loadUi', function () {
                beforeEach(function () {
                    createLoadUi();
                });
                it('should call the callback', function () {
                    var callback = jasmine.createSpy('callback');
                    globals.jasmineui.loadUi('somePage.html', callback);
                    expect(callback).toHaveBeenCalled();
                });
                it('should save errors in the callback into the persistentData', function () {
                    var error = new Error('test');
                    var callback = jasmine.createSpy('callback').andThrow(error);
                    globals.jasmineui.loadUi('somePage.html', callback);
                    expect(persistentData.globalErrors).toEqual([
                        {message:error.toString(), stack:error.stack}
                    ]);
                });
                it('should add specs into the persistentData', function () {
                    var someScriptUrl = 'someScriptUrl';
                    var specIds = ['spec1'];
                    var somePage = 'somePage.html';
                    scriptAccessor.currentScriptUrl.andReturn(someScriptUrl);
                    clientTestAdapter.listSpecIds.andReturn(specIds);
                    globals.jasmineui.loadUi(somePage, jasmine.createSpy('noop'));
                    expect(persistentData.specs).toEqual([
                        { testScript:someScriptUrl, url:somePage, id:specIds[0], results:[  ] }
                    ]);
                });
                it('should add specs incrementally with multiple calls to loadUi', function () {
                    clientTestAdapter.listSpecIds.andReturn(['spec1']);
                    scriptAccessor.currentScriptUrl.andReturn('someScript.js');
                    globals.jasmineui.loadUi('somePage.html', jasmine.createSpy('noop'));
                    clientTestAdapter.listSpecIds.andReturn(['spec1', 'spec2']);
                    scriptAccessor.currentScriptUrl.andReturn('someScript2.js');
                    globals.jasmineui.loadUi('somePage2.html', jasmine.createSpy('noop'));
                    expect(persistentData.specs).toEqual([
                        { testScript:'someScript.js', url:'somePage.html', id:'spec1', results:[  ] },
                        { testScript:'someScript2.js', url:'somePage2.html', id:'spec2', results:[  ] }
                    ]);
                });
            });
            describe('reportError', function() {
                it('should save errors in the callback into the persistentData', function () {
                    createLoadUi();
                    var error = new Error('test');
                    loadUi.reportError(error);
                    expect(persistentData.globalErrors).toEqual([
                        {message:error.toString(), stack:error.stack}
                    ]);
                });

            });

            function createOwnerDependentDescribes(modeName, ownerPropertyName) {
                describe(modeName, function () {
                    beforeEach(function () {
                        globals[ownerPropertyName] = {
                            jasmineui:{
                                loadUiServer:{
                                    createAndFilterSpecs:jasmine.createSpy('createAndFilterSpecs'),
                                    runFinished:jasmine.createSpy('runFinished')
                                }
                            }
                        };
                        createLoadUi();
                    });

                    it('should call opener.createAndFilterSpecs after async work', function () {
                        asyncSensor.afterAsync.mostRecentCall.args[0]();
                        expect(globals[ownerPropertyName].jasmineui.loadUiServer.createAndFilterSpecs).toHaveBeenCalledWith();
                    });
                    it('should call opener.runFinished if no specs were detected', function () {
                        asyncSensor.afterAsync.mostRecentCall.args[0]();
                        expect(globals[ownerPropertyName].jasmineui.loadUiServer.runFinished).toHaveBeenCalledWith();
                    });
                    it('should navigate to the next spec if specs are left', function () {
                        persistentData.specs = [
                            {id:'specId1', url:'somePage.html'}
                        ];
                        asyncSensor.afterAsync.mostRecentCall.args[0]();
                        expect(globals[ownerPropertyName].jasmineui.loadUiServer.runFinished).not.toHaveBeenCalledWith();
                        expect(urlLoader.navigateWithReloadTo).toHaveBeenCalledWith(globals, 'somePage.html');
                        expect(persistentData.specIndex).toBe(0);
                    });
                });
            }

            createOwnerDependentDescribes('popup mode', 'opener');
            createOwnerDependentDescribes('iframe mode', 'parent');
            describe('inplace mode', function () {
                beforeEach(function () {
                    persistentData.reporterUrl = 'someReporterUrl';
                    createLoadUi();
                });

                it('should navigate to the reporterUrl after async work', function () {
                    asyncSensor.afterAsync.mostRecentCall.args[0]();
                    expect(urlLoader.navigateWithReloadTo).toHaveBeenCalledWith(globals, persistentData.reporterUrl);
                });
            });
        });
        describe('execute phase', function () {
            beforeEach(function () {
                persistentData.specIndex = 0;
                persistentData.specs = [
                    {id:'spec1', url:'somePage.html', testScript:'someScript.js', results:[]}
                ]
            });
            it('should initialize the testAdapter with the current spec', function () {
                createLoadUi();
                expect(clientTestAdapter.initSpecRun).toHaveBeenCalledWith(persistentData.specs[0]);
            });
            it('should add the util scripts', function () {
                config.scripts = [
                    {
                        position:'begin',
                        url:'beginScript.js'
                    },
                    {
                        position:'end',
                        url:'endScript.js'
                    }
                ];
                createLoadUi();
                expect(instrumentor.beginScript).toHaveBeenCalledWith('beginScript.js');
                expect(instrumentor.endScript).toHaveBeenCalledWith('endScript.js');
            });
            it('should add the testScript as beginScript', function () {
                createLoadUi();
                expect(instrumentor.beginScript).toHaveBeenCalledWith(persistentData.specs[0].testScript);
            });
            it('should call the testAdapter runner after async', function () {
                createLoadUi();
                asyncSensor.afterAsync.mostRecentCall.args[0]();
                expect(executeTest).toHaveBeenCalled();
            });
            it('should save global errors into the current spec', function () {
                createLoadUi();
                globals.addEventListener.mostRecentCall.args[1]({message:'someError'});
                expect(persistentData.specs[0].results).toEqual([
                    {message:'someError'}
                ]);
            });
            describe('loadUi', function() {
                it('should execute the callback', function() {
                    createLoadUi();
                    var callback = jasmine.createSpy('callback');
                    globals.jasmineui.loadUi('somePage', callback);
                    expect(callback).toHaveBeenCalled();
                });
                it('should save errors in the callback into the current spec', function () {
                    createLoadUi();
                    var error = new Error('test');
                    var callback = jasmine.createSpy('callback').andThrow(error);
                    globals.jasmineui.loadUi('somePage.html', callback);
                    expect(persistentData.specs[0].results).toEqual([
                        {message:error.toString(), stack:error.stack}
                    ]);
                });
            });
            describe('reportError', function() {
                it('should save errors in the callback into the current spec', function () {
                    createLoadUi();
                    var error = new Error('test');
                    loadUi.reportError(error);
                    expect(persistentData.specs[0].results).toEqual([
                        {message:error.toString(), stack:error.stack}
                    ]);
                });

            });
            function createOwnerDependentDescribes(modeName, ownerPropertyName) {
                describe(modeName, function () {
                    beforeEach(function () {
                        globals[ownerPropertyName] = {
                            jasmineui:{
                                loadUiServer:{
                                    specFinished:jasmine.createSpy('specFinished'),
                                    runFinished:jasmine.createSpy('runFinished')
                                }
                            }
                        };
                        createLoadUi();
                    });
                    it('should call owner.testFinished', function () {
                        asyncSensor.afterAsync.mostRecentCall.args[0]();
                        expect(globals[ownerPropertyName].jasmineui.loadUiServer.specFinished).not.toHaveBeenCalled();
                        executeTest.mostRecentCall.args[0]();
                        expect(globals[ownerPropertyName].jasmineui.loadUiServer.specFinished).toHaveBeenCalledWith(persistentData.specs[0]);
                    });
                    it('should call opener.runFinished if no specs are left', function () {
                        asyncSensor.afterAsync.mostRecentCall.args[0]();
                        executeTest.mostRecentCall.args[0]();
                        expect(globals[ownerPropertyName].jasmineui.loadUiServer.runFinished).toHaveBeenCalledWith();
                    });
                    it('should navigate to the next spec if specs are left', function () {
                        persistentData.specs.push(
                            {id:'spec2', url:'somePage2.html', testScript:'someScript2.js'}
                        );
                        asyncSensor.afterAsync.mostRecentCall.args[0]();
                        executeTest.mostRecentCall.args[0]();
                        expect(globals[ownerPropertyName].jasmineui.loadUiServer.runFinished).not.toHaveBeenCalledWith();
                        expect(urlLoader.navigateWithReloadTo).toHaveBeenCalledWith(globals, 'somePage2.html');
                        expect(persistentData.specIndex).toBe(1);
                    });

                });

            }

            createOwnerDependentDescribes('popup mode', 'opener');
            createOwnerDependentDescribes('iframe mode', 'parent');

            describe("inplace mode", function () {
                beforeEach(function () {
                    persistentData.reporterUrl = 'someReporterUrl';
                    createLoadUi();
                });
                it('should navigate to the reporterUrl if no specs are left', function () {
                    asyncSensor.afterAsync.mostRecentCall.args[0]();
                    executeTest.mostRecentCall.args[0]();
                    expect(urlLoader.navigateWithReloadTo).toHaveBeenCalledWith(globals, persistentData.reporterUrl);
                });
                it('should navigate to the next spec if specs are left', function () {
                    persistentData.specs.push(
                        {id:'spec2', url:'somePage2.html', testScript:'someScript2.js'}
                    );
                    asyncSensor.afterAsync.mostRecentCall.args[0]();
                    executeTest.mostRecentCall.args[0]();
                    expect(urlLoader.navigateWithReloadTo).toHaveBeenCalledWith(globals, 'somePage2.html');
                    expect(persistentData.specIndex).toBe(1);
                });
            });
        });

    });
});
