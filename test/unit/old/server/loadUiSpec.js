jasmineui.require(["factory!server/loadUi"], function (loadUiFactory) {
    describe("server/loadUi", function () {
        var config, persistentData, persistentDataAccessor, scriptAccessor, globals, serverTestAdapter, loadUi, urlLoader;
        var saveDataToWindow, runnerCallback, createSpecs, reportSpecResults;
        beforeEach(function () {
            config = {};
            persistentData = {};
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
                jasmineui:{},
                location:{
                    href:'someOriginalRunner.html'
                }
            };
            urlLoader = {
                navigateWithReloadTo:jasmine.createSpy('navigateWithReloadTo'),
                openTestWindow:jasmine.createSpy('openTestWindow'),
                closeTestWindow:jasmine.createSpy('closeTestWindow'),
                checkAndNormalizeUrl: jasmine.createSpy('checkAndNormalizeUrl').andCallFake(function(url) {
                    return url;
                })
            };
            createSpecs = jasmine.createSpy('createSpecs').andCallFake(function (specIds) {
                return specIds;
            });
            reportSpecResults = jasmine.createSpy('reportSpecResults');
            runnerCallback = function () {
                return serverTestAdapter.interceptSpecRunner.mostRecentCall.args[0]();
            };
            serverTestAdapter = {
                interceptSpecRunner:jasmine.createSpy('replaceSpecRunner'),
                reportSpecResults:reportSpecResults,
                createSpecs:createSpecs
            };
        });

        function createLoadUi() {
            loadUi = loadUiFactory({
                config:config,
                persistentData:persistentDataAccessor,
                scriptAccessor:scriptAccessor,
                globals:globals,
                'server/testAdapter':serverTestAdapter,
                urlLoader:urlLoader
            });
        }

        describe('inplace mode', function () {
            beforeEach(function () {
                config.loadMode = "inplace";
            });
            describe('start phase', function () {
                beforeEach(function () {
                    createLoadUi();
                });
                it('should not open any url but call createSpecs with empty list if no specs are defined', function () {
                    runnerCallback();
                    expect(urlLoader.navigateWithReloadTo).not.toHaveBeenCalled();
                    expect(createSpecs).toHaveBeenCalledWith([]);
                });
                it('should load the first page defined by loadUi', function () {
                    var somePage = '/somePage.html';
                    globals.jasmineui.loadUi(somePage);
                    runnerCallback();
                    expect(urlLoader.navigateWithReloadTo).toHaveBeenCalledWith(globals, somePage);
                });
                it('should load the first page defined by loadUi calculating the url using urlLoader.checkAndNormalizeUrl', function () {
                    var somePage = '/somePage.html';
                    var someNewPage = '/someNewPage.html';
                    urlLoader.checkAndNormalizeUrl.andReturn(someNewPage);
                    globals.jasmineui.loadUi(somePage);
                    runnerCallback();
                    expect(urlLoader.checkAndNormalizeUrl).toHaveBeenCalledWith(somePage);
                    expect(urlLoader.navigateWithReloadTo).toHaveBeenCalledWith(globals, someNewPage);
                });
                it('should initialize the persistentData', function () {
                    var someSpec = 'someSpec.js';
                    scriptAccessor.currentScriptUrl.andReturn(someSpec);
                    globals.jasmineui.loadUi('somePage.html');
                    runnerCallback();
                    expect(persistentData).toEqual({
                        reporterUrl:globals.location.href,
                        specs:[],
                        specIndex:-1,
                        globalErrors:[],
                        analyzeScripts:[someSpec]
                    });
                });
                it('should not start if some urls are reported invalid by urlLoader.checkAndNormalizeUrl', function () {
                    var error = new Error('test');
                    urlLoader.checkAndNormalizeUrl.andThrow(error);

                    globals.jasmineui.loadUi('somePage.html');
                    runnerCallback();
                    expect(urlLoader.navigateWithReloadTo).not.toHaveBeenCalled();
                    var errorSpec = {
                        id:'global#errors',
                        results:[
                            { message:error.toString(), stack: error.stack }
                        ]
                    };
                    expect(createSpecs).toHaveBeenCalledWith([ errorSpec ]);
                    expect(reportSpecResults).toHaveBeenCalledWith(errorSpec);
                    expect(persistentData.specs).toEqual([]);
                });
                it('should not start if uncatched errors exist but report an error spec', function () {
                    var errorListener = globals.addEventListener.mostRecentCall.args[1];
                    var someError = 'someError';
                    errorListener({message:someError});
                    var somePage = 'somePage.html';
                    globals.jasmineui.loadUi(somePage);
                    runnerCallback();
                    expect(urlLoader.navigateWithReloadTo).not.toHaveBeenCalled();
                    var errorSpec = {
                        id:'global#errors',
                        results:[
                            { message:someError }
                        ]
                    };
                    expect(createSpecs).toHaveBeenCalledWith([ errorSpec ]);
                    expect(reportSpecResults).toHaveBeenCalledWith(errorSpec);
                    expect(persistentData.specs).toEqual([]);
                });


            });

            describe('filter phase', function () {
                beforeEach(function () {
                    persistentData = {
                        reporterUrl:globals.location.href,
                        specs:[
                            {id:'spec1', url:'page1.html'},
                            {id:'spec2', url:'page2.html'}
                        ],
                        specIndex:-1,
                        globalErrors:[],
                        analyzeScripts:['someSpec.js']
                    };
                    createLoadUi();
                });
                it('should not check urls in loadUi', function() {
                    globals.jasmineui.loadUi('someUrl');
                    expect(urlLoader.checkAndNormalizeUrl).not.toHaveBeenCalled();
                });
                it('should filter the specs using the testAdapter', function () {
                    createSpecs.andCallFake(function (specs) {
                        return [specs[1]];
                    });
                    runnerCallback();
                    expect(persistentData.specs).toEqual([
                        {id:'spec2', url:'page2.html'}
                    ]);
                    expect(urlLoader.navigateWithReloadTo).toHaveBeenCalledWith(globals, 'page2.html');
                });
                it('should not report results', function () {
                    runnerCallback();
                    expect(reportSpecResults).not.toHaveBeenCalled();
                });
                it('should do nothing if all specs are filtered', function () {
                    createSpecs.andCallFake(function (specs) {
                        return [];
                    });
                    runnerCallback();
                    expect(urlLoader.navigateWithReloadTo).not.toHaveBeenCalled();
                });
                it('should report errors from the analyzing phase in the client', function () {
                    var someError = 'someError';
                    persistentData.globalErrors = [
                        {
                            message:someError
                        }
                    ];
                    runnerCallback();
                    expect(urlLoader.navigateWithReloadTo).not.toHaveBeenCalled();
                    var errorSpec = {
                        id:'global#errors',
                        results:[
                            { message:someError }
                        ]
                    };
                    expect(createSpecs).toHaveBeenCalledWith([ errorSpec ]);
                    expect(reportSpecResults).toHaveBeenCalledWith(errorSpec);
                    expect(persistentData.specs).toEqual([]);
                });
            });
            describe('results phase', function () {
                beforeEach(function () {
                    persistentData = {
                        reporterUrl:globals.location.href,
                        specs:[
                            {id:'spec1', url:'page1.html', results:[]}
                        ],
                        specIndex:1,
                        globalErrors:[],
                        analyzeScripts:['someSpec.js']
                    };
                    createLoadUi();

                });
                it('should not check urls in loadUi', function() {
                    globals.jasmineui.loadUi('someUrl');
                    expect(urlLoader.checkAndNormalizeUrl).not.toHaveBeenCalled();
                });
                it('should create and report the results to the testAdapter', function () {
                    runnerCallback();
                    expect(createSpecs).toHaveBeenCalledWith(persistentData.specs);
                    expect(reportSpecResults).toHaveBeenCalledWith(persistentData.specs[0]);
                });
            });
        });
        describe('popup/iframe mode', function () {
            beforeEach(function () {
                config.loadMode = "popup";
            });
            describe('start phase', function () {
                beforeEach(function () {
                    createLoadUi();
                });
                it('should not open any url but call createSpecs with empty list if no specs are defined', function () {
                    runnerCallback();
                    expect(urlLoader.navigateWithReloadTo).not.toHaveBeenCalled();
                    expect(saveDataToWindow).not.toHaveBeenCalled();
                    expect(createSpecs).toHaveBeenCalledWith([]);
                });
                it('should load the first page defined by loadUi', function () {
                    var somePage = 'somePage.html';
                    globals.jasmineui.loadUi(somePage);
                    runnerCallback();
                    expect(urlLoader.openTestWindow).toHaveBeenCalledWith(somePage);
                });
                it('should initialize the persistentData', function () {
                    var someSpec = 'someSpec.js';
                    scriptAccessor.currentScriptUrl.andReturn(someSpec);
                    globals.jasmineui.loadUi('somePage.html');
                    runnerCallback();
                    expect(persistentData).toEqual({
                        specs:[],
                        specIndex:-1,
                        globalErrors:[],
                        analyzeScripts:[someSpec]
                    });
                });
                it('should not start if some urls are reported invalid by urlLoader.checkAndNormalizeUrl', function () {
                    var error = new Error('test');
                    urlLoader.checkAndNormalizeUrl.andThrow(error);

                    globals.jasmineui.loadUi('somePage.html');
                    runnerCallback();
                    expect(urlLoader.navigateWithReloadTo).not.toHaveBeenCalled();
                    var errorSpec = {
                        id:'global#errors',
                        results:[
                            { message:error.toString(), stack: error.stack }
                        ]
                    };
                    expect(createSpecs).toHaveBeenCalledWith([ errorSpec ]);
                    expect(reportSpecResults).toHaveBeenCalledWith(errorSpec);
                    expect(persistentData.specs).toEqual([]);
                });
                it('should not start if uncatched errors exist but report an error spec', function () {
                    var errorListener = globals.addEventListener.mostRecentCall.args[1];
                    var someError = 'someError';
                    errorListener({message:someError});
                    var somePage = 'somePage.html';
                    globals.jasmineui.loadUi(somePage);
                    runnerCallback();
                    expect(saveDataToWindow).not.toHaveBeenCalled();
                    var errorSpec = {
                        id:'global#errors',
                        results:[
                            { message:someError }
                        ]
                    };
                    expect(createSpecs).toHaveBeenCalledWith([ errorSpec ]);
                    expect(reportSpecResults).toHaveBeenCalledWith(errorSpec);
                    expect(persistentData.specs).toEqual([]);
                });
                describe('filter phase', function () {
                    beforeEach(function () {
                        createLoadUi();
                        globals.jasmineui.loadUi("somePage.html");
                        runnerCallback();
                        persistentData.specs = [
                            {id:'spec1', url:'page1.html'},
                            {id:'spec2', url:'page2.html'}
                        ];
                    });
                    it('should filter the specs using the testAdapter', function () {
                        var spec1 = persistentData.specs[0];
                        var spec2 = persistentData.specs[1];
                        createSpecs.andCallFake(function (specs) {
                            return [specs[1]];
                        });
                        globals.jasmineui.loadUiServer.createAndFilterSpecs();
                        expect(persistentData.specs).toEqual([spec2]);
                        expect(createSpecs).toHaveBeenCalledWith([spec1, spec2]);
                    });
                    it('should not report results', function () {
                        globals.jasmineui.loadUiServer.createAndFilterSpecs();
                        expect(reportSpecResults).not.toHaveBeenCalled();
                    });
                    it('should report errors from the analyzing phase in the client', function () {
                        var someError = 'someError';
                        persistentData.globalErrors = [
                            {
                                message:someError
                            }
                        ];
                        globals.jasmineui.loadUiServer.createAndFilterSpecs();
                        var errorSpec = {
                            id:'global#errors',
                            results:[
                                { message:someError }
                            ]
                        };
                        expect(createSpecs).toHaveBeenCalledWith([ errorSpec ]);
                        expect(reportSpecResults).toHaveBeenCalledWith(errorSpec);
                        expect(persistentData.specs).toEqual([]);
                    });
                });
                describe('results phase', function () {
                    beforeEach(function () {
                        createLoadUi();
                        globals.jasmineui.loadUi("somePage.html");
                        runnerCallback();
                        persistentData.specs = [
                            {id:'spec1', url:'page1.html', results:[]}
                        ];
                    });
                    it('should report the results to the testAdapter', function () {
                        globals.jasmineui.loadUiServer.specFinished(persistentData.specs[0]);
                        expect(reportSpecResults).toHaveBeenCalledWith(persistentData.specs[0]);
                    });
                    it('should close the window if specs are finished', function () {
                        globals.jasmineui.loadUiServer.runFinished();
                        expect(urlLoader.closeTestWindow).toHaveBeenCalled();
                    });
                });
            });

        });


    });
});
