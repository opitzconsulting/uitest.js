jasmineui.require(["factory!config"], function (configFactory) {
    describe("config", function () {
        var config, persistentDataAccessor, persistentData, scriptAccessor, globals, instrumentor;

        beforeEach(function () {
            instrumentor = {
                setInstrumentUrlPatterns: jasmine.createSpy('setInstrumentUrlPatterns')
            };
            globals = {};
            persistentData = {};
            persistentDataAccessor = function () {
                return persistentData;
            };
            scriptAccessor = {
                currentScriptUrl:jasmine.createSpy('currentScriptUrl')
            };
        });

        function createConfig() {
            config = configFactory({
                globals:globals,
                persistentData:persistentDataAccessor,
                scriptAccessor:scriptAccessor,
                instrumentor:instrumentor
            });
        }

        it('should use defaults if nothing else is specified', function () {
            scriptAccessor.currentScriptUrl.andReturn('jasmineui.js');
            createConfig();
            expect(config).toEqual({
                logEnabled:false,
                asyncSensors:['load', 'timeout', 'interval', 'xhr', '$animationComplete', '$transitionComplete'],
                waitsForAsyncTimeout:5000,
                loadMode:'inplace',
                closeTestWindow:true,
                scripts:[],
                baseUrl:scriptAccessor.currentScriptUrl(),
                instrumentUrlPatterns:[]
            });
        });

        it('should always add the "load" sensor to the asyncSensors', function() {
            globals.jasmineuiConfig = {
                asyncSensors: []
            };
            createConfig();
            expect(config.asyncSensors).toEqual(["load"]);

        });

        it('should merge values from globals.jasmineuiConfig', function() {
            globals.jasmineuiConfig = {
                baseUrl: 'someBase'
            };
            createConfig();
            expect(config.baseUrl).toBe('someBase');
            expect(config.waitsForAsyncTimeout).toBe(5000);
        });

        it('should merge values from persistentData', function() {
            persistentData.config = {
                baseUrl: 'someBase'
            };
            createConfig();
            expect(config.baseUrl).toBe('someBase');
            expect(config.waitsForAsyncTimeout).toBe(5000);
        });

        it('should save the object into persistentData', function() {
            createConfig();
            expect(persistentData.config).toBe(config);
        });

        it('should make the scripts urls absolute', function() {
            globals.jasmineuiConfig = {
                scripts: [
                    {position:'begin', url: 'someUrl'}
                ],
                baseUrl: '/base/'
            };
            createConfig();
            expect(config.scripts[0].url).toBe('/base/someUrl');
        });

        it('should set the setInstrumentUrlPatterns in the instrumentor', function() {
            globals.jasmineuiConfig = {
                instrumentUrlPatterns: ['.*']
            };
            createConfig();
            expect(instrumentor.setInstrumentUrlPatterns).toHaveBeenCalledWith(['.*'])
        });

    });
});
