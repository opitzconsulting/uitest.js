jasmineui.define('config', ['globals', 'persistentData', 'scriptAccessor', 'urlParser', 'instrumentor'], function (globals, persistentData, scriptAccessor, urlParser, instrumentor) {
    var pd = persistentData();

    var config = {
        logEnabled:false,
        asyncSensors:['load', 'timeout', 'interval', 'xhr', '$animationComplete', '$transitionComplete'],
        waitsForAsyncTimeout:5000,
        loadMode:'inplace',
        closeTestWindow:true,
        scripts:[],
        // Default is the url of jasmine ui
        baseUrl: scriptAccessor.currentScriptUrl(),
        instrumentUrlPatterns:[]
    };

    function merge(obj) {
        var prop;
        for (prop in obj) {
            config[prop] = obj[prop];
        }
    }

    if (pd.config) {
        merge(pd.config);
    }
    if (globals.jasmineuiConfig) {
        merge(globals.jasmineuiConfig);
    }

    function makeScriptUrlsAbsolute(baseUrl, scripts) {
        var i;
        for (i=0; i<scripts.length; i++) {
            scripts[i].url = urlParser.makeAbsoluteUrl(baseUrl, scripts[i].url);
        }
    }
    makeScriptUrlsAbsolute(config.baseUrl, config.scripts);

    function addLoadSensor(sensors) {
        var i;
        for (i=0; i<sensors.length; i++) {
            if (sensors[i]==='load') {
                return;
            }
        }
        sensors.push("load");
    }
    addLoadSensor(config.asyncSensors);

    pd.config = config;

    instrumentor.setInstrumentUrlPatterns(config.instrumentUrlPatterns);

    return config;
});