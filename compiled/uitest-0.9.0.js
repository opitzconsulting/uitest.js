/**
* uitest.js v0.9.0
* http://github.com/tigbro/uitest
*
* Copyright 2011, Tobias Bosch (OPITZ CONSULTING GmbH)
* Licensed under the MIT license.
*
*/
/**
 * Simple implementation of AMD require/define assuming all
 * modules are named and loaded explicitly, and require is called
 * after all needed modules have been loaded.
 */
(function (window) {
    var ns = window.uitest = window.uitest || {};

    var define = function (name, deps, value) {
        var dotJs = name.indexOf('.js');
        if (dotJs !== -1) {
            name = name.substring(0, dotJs);
        }
        if (arguments.length == 2) {
            // No deps...
            value = deps;
            deps = [];
        }
        var def = {
            name:name,
            deps:deps,
            value:value
        };
        for (var i = 0; i < define.moduleDefs.length; i++) {
            var mod = define.moduleDefs[i];
            if (mod.name === name) {
                define.moduleDefs[i] = def;
                return;
            }
        }
        define.moduleDefs.push(def);
    };
    define.moduleDefs = [];
    define.plugins = {
        factory:factoryPlugin
    };
    define.conditionals = {
        client:function () {
            return !!document.documentElement.getAttribute("jasmineuiClient");
        },
        server:function () {
            return !define.conditionals.client();
        }
    };

    function findModuleDefinition(name) {
        for (var i = 0; i < define.moduleDefs.length; i++) {
            var mod = define.moduleDefs[i];
            if (mod.name == name) {
                return mod;
            }
        }
        throw new Error("Could not find the module " + name);
    }

    function plugin(pluginName, moduleName) {
        var p = define.plugins[pluginName];
        if (!p) {
            throw new Error("Unknown plugin " + pluginName);
        }
        return p(moduleName);
    }

    function factoryPlugin(moduleName) {
        return function (cache) {
            cache = cache || {};
            return factory(moduleName, cache);
        }
    }

    function factory(name, instanceCache) {
        if (!instanceCache) {
            instanceCache = {};
        }
        if (instanceCache[name] === undefined) {
            var resolvedValue;
            var pluginSeparator = name.indexOf('!');
            if (pluginSeparator !== -1) {
                var pluginName = name.substring(0, pluginSeparator);
                var moduleName = name.substring(pluginSeparator + 1);
                resolvedValue = plugin(pluginName, moduleName);
            } else {
                // Normal locally defined modules.
                var mod = findModuleDefinition(name);
                var resolvedDeps = listFactory(mod.deps, instanceCache);
                resolvedValue = mod.value;
                if (typeof mod.value === 'function') {
                    resolvedValue = mod.value.apply(window, resolvedDeps);
                }
            }

            instanceCache[name] = resolvedValue;
            if (resolvedValue && resolvedValue.global) {
                var global = factory('global', instanceCache);
                mergeObjects(resolvedValue.global, global);

            }

        }
        return instanceCache[name];
    }

    function mergeObjects(source, target) {
        var prop, oldValue, newValue;
        for (prop in source) {
            newValue = source[prop];
            oldValue = target[prop];
            if (typeof oldValue === 'object') {
                mergeObjects(newValue, oldValue);
            } else {
                target[prop] = newValue;
            }
        }
    }

    function listFactory(deps, instanceCache) {
        if (!instanceCache) {
            instanceCache = {};
        }
        var resolvedDeps = [];
        for (var i = 0; i < deps.length; i++) {
            resolvedDeps.push(factory(deps[i], instanceCache));
        }
        return resolvedDeps;
    }

    var require = function (deps, callback) {
        var resolvedDeps = listFactory(deps, require.cache);
        // Note: testing if typeof callback==="function" does not work
        // in IE9 from remote window (then everything is an object...)
        if (callback && callback.apply) {
            callback.apply(this, resolvedDeps);
        }
        return resolvedDeps;
    };

    require.all = function (callback, filter) {
        var i, def;
        var modules = {};
        for (i = 0; i < define.moduleDefs.length; i++) {
            def = define.moduleDefs[i];
            if (!filter || filter(def.name)) {
                require([def.name], function (module) {
                    modules[def.name] = module;
                });
            }
        }
        if (callback) callback(modules);
    };

    require.cache = {};

    ns.require = require;
    ns.define = define;

})(window);

uitest.define('config', [], function() {
	var exports,
		LOAD_MODE_IFRAME = "iframe",
        LOAD_MODE_POPUP = "popup";

	function create() {
		if (this === exports) {
			return new create();
		}
		this._data = {};
	}

	create.prototype = {
		parent: simpleProp("_parent"),
		sealed: simpleProp("_sealed"),
		url: dataProp("url"),
		loadMode: dataProp("loadMode", loadModeValidator),
		readySensors: dataProp("readySensors"),
		append: dataAdder("appends"),
		prepend: dataAdder("prepends"),
		intercept: dataAdder("intercepts"),
		buildConfig: buildConfig
	};

	function getterSetter(getter, setter) {
		return result;

		function result() {
			if(arguments.length === 0) {
				return getter.call(this);
			} else {
				setter.apply(this, arguments);
				return this;
			}
		}
	}

	function simpleProp(name) {
		return getterSetter(function() {
			return this[name];
		}, function(newValue) {
			this[name] = newValue;
		});
	}

	function dataProp(name, checkFn) {
		return getterSetter(function() {
			return this._data[name];
		}, function(newValue) {
			checkNotSealed(this);
			if (checkFn) checkFn(newValue);
			this._data[name] = newValue;
		});
	}

	function dataAdder(name, checkFn) {
		return getterSetter(function() {
			return this._data[name];
		}, function(newValue) {
			checkNotSealed(this);
			if (checkFn) checkFn(newValue);
			if (!this._data[name]) {
				this._data[name] = [];
				this._data[name].dataAdder = true;
			}
			this._data[name].push(newValue);
		});
	}

	function checkNotSealed(self) {
		if (self.sealed()) {
			throw new Error("This configuration cannot be modified.");
		}
	}

	function loadModeValidator(mode) {
		if(mode !== LOAD_MODE_POPUP && mode !== LOAD_MODE_IFRAME) {
			throw new Error("unknown mode: " + mode);
		}
	}

	function buildConfig(target) {
		target = target || {
			readySensors: ['timeout', 'interval', 'xhr', '$animation'],
			appends: [],
			prepends: [],
			intercepts: [],
			loadMode: LOAD_MODE_IFRAME
		};
		if (this.parent()) {
			this.parent().buildConfig(target);
		}
		var prop, value, oldValue,
            data = this._data;
		for(prop in data) {
			value = data[prop];
			if(isArray(value) && value.dataAdder) {
				value = (target[prop] || []).concat(value);
			}
			target[prop] = value;
		}
		return target;
	}

	function isArray(obj) {
		return obj && obj.push;
	}

	exports = {
		create: create
	};
	return exports;
});
uitest.define('documentUtils', [], function() {

    var // Groups:
        // 1. text of all element attributes
        // 2. content of src attribute
        // 3. text content of script element.
        SCRIPT_RE = /<script([^>]*src=\s*"([^"]+))?[^>]*>([\s\S]*?)<\/script>/g;

    function serializeDocType(doc) {
        var node = doc.doctype;
        if(!node) {
            return '';
        }
        return "<!DOCTYPE " + node.name + (node.publicId ? ' PUBLIC "' + node.publicId + '"' : '') + (!node.publicId && node.systemId ? ' SYSTEM' : '') + (node.systemId ? ' "' + node.systemId + '"' : '') + '>';
    }

    function serializeHtmlTag(doc) {
        var el = doc.documentElement,
            i, attr;
        var parts = ['<html'];
        for(i = 0; i < el.attributes.length; i++) {
            attr = el.attributes[i];
            if(attr.value !== undefined) {
                parts.push(attr.name + '="' + attr.value + '"');
            } else {
                parts.push(attr.name);
            }
        }
        return parts.join(" ") + ">";
    }

    function serializeHtmlBeforeLastScript(doc) {
        var innerHtml = doc.documentElement.innerHTML;
        var lastScript = innerHtml.lastIndexOf('<script');
        return serializeDocType(doc) + serializeHtmlTag(doc) + innerHtml.substring(0, lastScript);
    }

    function contentScriptHtml(content) {
        return '<script type="text/javascript">'+content+'</script>';
    }

    function urlScriptHtml(url) {
        return '<script type="text/javascript" src="'+url+'"></script>';
    }

    function loadScript(win, url, resultCallback, async) {
        var xhr = new win.XMLHttpRequest();
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    resultCallback(null, xhr.responseText + "//@ sourceURL=" + url);
                } else {
                    resultCallback(new Error("Error loading url " + url + ":" + xhr.statusText));
                }
            }
        };
        xhr.open("GET", url, async);
        xhr.send();
    }

    function evalScript(win, scriptContent) {
        win["eval"].call(win, scriptContent);
    }

    function loadAndEvalScriptSync(win, url) {
        loadScript(win, url, function(error, data) {
            if (error) {
                throw error;
            }
            evalScript(win, data);
        });
    }

    function replaceScripts(html, callback) {
        return html.replace(SCRIPT_RE, function (match, allElements, srcAttribute, textContent) {
            var result = callback(srcAttribute, textContent, match);
            if (result===undefined) {
                return match;
            }
            return result;
        });
    }

    function rewriteDocument(win, html) {
        // eval is required here so that the window keeps
        // it's current location.href!
        win.newContent = html;
        win.eval('document.open();document.write(newContent);document.close();');
        win.newContent = '';
    }

    return {
        serializeDocType: serializeDocType,
        serializeHtmlTag: serializeHtmlTag,
        serializeHtmlBeforeLastScript: serializeHtmlBeforeLastScript,
        contentScriptHtml: contentScriptHtml,
        urlScriptHtml: urlScriptHtml,
        loadScript: loadScript,
        evalScript: evalScript,
        loadAndEvalScriptSync: loadAndEvalScriptSync,
        replaceScripts: replaceScripts,
        rewriteDocument: rewriteDocument
    };
});
uitest.define('facade', ['urlLoader', 'ready', 'loadSensor', 'config', 'injector', 'instrumentor', 'global'], function(urlLoader, readyModule, loadSensor, config, injector, instrumentor, global) {
    var CONFIG_FUNCTIONS = ['parent', 'url', 'loadMode', 'readySensors', 'append', 'prepend', 'intercept'],
        _currentIdAccessor = function() { return ''; }, current;

    function create() {
        var res = {
            ready: ready,
            realoded: reloaded,
            reloaded: reloaded,
            inject: inject
        },
            i, fnName, configInstance;
        configInstance = res._config = config.create();
        for(i = 0; i < CONFIG_FUNCTIONS.length; i++) {
            fnName = CONFIG_FUNCTIONS[i];
            res[fnName] = delegate(configInstance[fnName], configAccessor);
        }
        return res;

        function configAccessor(uit) {
            return uit && uit._config;
        }
    }

    function createDispatcherFacade(dispatcher) {
        // create a dummy uitest instance,
        // so we know which functions we can delegate...
        var res = {};
        var dummy = create(),
            prop;
        for (prop in dummy) {
            if (typeof dummy[prop] === 'function') {
                res[prop] = delegate(dummy[prop], dispatcherWrapper);
            }
        }

        return res;

        function dispatcherWrapper(caller) {
            if (caller===res) {
                return dispatcher();
            }
        }
    }

    function createCurrentFacade() {
        var uitCache = {};
        return createDispatcherFacade(currentDispatcher);

        function currentDispatcher() {
            var currentId = currentIdAccessor()(),
                uit = uitCache[currentId],
                parentUit = findParentUit(currentId);
            if (!uit) {
                uit = create();
                if (parentUit) {
                    uit.parent(parentUit);
                }
                uitCache[currentId] = uit;
            }
            return uit;
        }

        function findParentUit(childId) {
            var id, parentId;
            for (id in uitCache) {
                if (id!==childId && childId.indexOf(id)===0) {
                    if (!parentId || id.length>parentId) {
                        parentId = id;
                    }
                }
            }
            return uitCache[parentId];
        }
    }

    function currentIdAccessor(value) {
        if (typeof value === 'function') {
            _currentIdAccessor = value;
        }
        return _currentIdAccessor;
    }

    function cleanup() {
        urlLoader.close();
    }

    function delegate(fn, targetAccessor) {
        return function() {
            var i,
                args = Array.prototype.slice.call(arguments),
                target = targetAccessor(this),
                otherTarget;
            for (i=0; i<args.length; i++) {
                otherTarget = targetAccessor(args[i]);
                if (otherTarget) {
                    args[i] = otherTarget;
                }
            }
            var res = fn.apply(target, args);
            if(res === target) {
                res = this;
            }
            return res;
        };
    }

    function ready(callback) {
        var self = this;
        if(!this._runInstance) {
            this._config.sealed(true);
            var config = this._config.buildConfig();
            config.readySensors = config.readySensors || [];
            config.readySensors.push(loadSensor.sensorName);
            instrumentor.init(config);
            this._runInstance = {
                config: config,
                readySensorInstances: readyModule.createSensors(config),
                frame: urlLoader.open(config)
            };

        }
        return readyModule.ready(this._runInstance.readySensorInstances, injectedCallback);

        function injectedCallback() {
            var frame = self._runInstance.frame;
            return injector.inject(callback, frame, [frame]);
        }
    }

    function reloaded(callback) {
        loadSensor.waitForReload(this._runInstance.readySensorInstances);
        this.ready(callback);
    }

    function inject(callback) {
        if(!this._runInstance) {
            throw new Error("The test page has not yet loaded. Please call ready first");
        }
        var frame = this._runInstance.frame;
        return injector.inject(callback, frame, [frame]);
    }

    current = createCurrentFacade();

    return {
        create: create,
        cleanup: cleanup,
        current: current,
        currentIdAccessor: currentIdAccessor,
        global: {
            uitest: {
                create: create,
                cleanup: cleanup,
                current: current
            }
        }
    };
});
uitest.define('global', [], function() {
	return window;
});

uitest.define('injector', [], function() {

	// Copied from https://github.com/angular
	var FN_ARGS = /^function\s*[^\(]*\(\s*([^\)]*)\)/m;
	var FN_ARG_SPLIT = /,/;
	var FN_ARG = /^\s*(_?)(\S+?)\1\s*$/;
	var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;

	function annotate(fn) {
		var $inject, fnText, argDecl, last, args, i;

		if(typeof fn == 'function') {
			if(!($inject = fn.$inject)) {
				$inject = [];
				fnText = fn.toString().replace(STRIP_COMMENTS, '');
				argDecl = fnText.match(FN_ARGS);
				args = argDecl[1].split(FN_ARG_SPLIT);
				for(i = 0; i < args.length; i++) {
					args[i].replace(FN_ARG, addFnArgTo$Inject);
				}
				fn.$inject = $inject;
			}
		} else if(isArray(fn)) {
			last = fn.length - 1;
			assertArgFn(fn[last], 'fn');
			$inject = fn.slice(0, last);
		} else {
			assertArgFn(fn, 'fn', true);
		}
		return $inject;

		function addFnArgTo$Inject(all, underscore, name) {
			$inject.push(name);
		}
	}

	function inject(fn, self, values) {
		var argNames = annotate(fn),
			argValues = [],
			i;
		fn = isArray(fn)?fn[fn.length-1]:fn;
		for (i=0; i<argNames.length; i++) {
			argValues.push(findValue(argNames[i]));
		}
		return fn.apply(self, argValues);

		function findValue(argName) {
			var i;
			for (i=0; i<values.length; i++) {
				if (argName in values[i]) {
					return values[i][argName];
				}
			}
			return undefined;
		}
	}

	/**
	 * throw error of the argument is falsy.
	 */
	function assertArg(arg, name, reason) {
		if(!arg) {
			throw new Error("Argument '" + (name || '?') + "' is " + (reason || "required"));
		}
		return arg;
	}

	function assertArgFn(arg, name, acceptArrayAnnotation) {
		if(acceptArrayAnnotation && isArray(arg)) {
			arg = arg[arg.length - 1];
		}

		assertArg(isFunction(arg), name, 'not a function, got ' + (arg && typeof arg == 'object' ? arg.constructor.name || 'Object' : typeof arg));
		return arg;
	}

	function isFunction(value) {
		return typeof value == 'function';
	}

	function isArray(value) {
		return toString.apply(value) == '[object Array]';
	}


	return {
		annotate: annotate,
		inject: inject
	};
});
uitest.define('instrumentor', ['injector', 'documentUtils'], function(injector, docUtils) {

    var exports,
        NO_SCRIPT_TAG = "noscript",
        currentConfig,
        REQUIRE_JS_RE = /require[^a-z]/,
        // group 1: name of function
        NAMED_FUNCTION_RE = /function\s*(\w+)[^{]*{/g;

    function init(config) {
        currentConfig = config;
        instrument.callbacks = [];
    }

    function instrument(win) {
        exports.deactivateAndCaptureHtml(win, function(html) {
            html = exports.modifyHtmlWithConfig(html);
            docUtils.rewriteDocument(win, html);
        });
    }

    function deactivateAndCaptureHtml(win, callback) {
        // This will wrap the rest of the document into a noscript tag.
        // By this, that content will not be executed!
        var htmlPrefix = docUtils.serializeHtmlBeforeLastScript(win.document);
        win.document.write('</head><body><' + NO_SCRIPT_TAG + '>');
        win.document.addEventListener('DOMContentLoaded', function() {
            var noscriptEl = win.document.getElementsByTagName(NO_SCRIPT_TAG)[0];
            callback(htmlPrefix + noscriptEl.textContent);
        }, false);
    }

    function createRemoteCallExpression(callback) {
        var argExpressions = Array.prototype.slice.call(arguments, 1) || [],
            callbackId = instrument.callbacks.length;
        instrument.callbacks.push(callback);
        return "(opener||parent).uitest.instrument.callbacks["+callbackId+"]("+argExpressions.join(",")+");";
    }

    function modifyHtmlWithConfig(html) {
        if (currentConfig.prepends) {
            html = handlePrepends(html, currentConfig.prepends);
        }
        var scripts = handleScripts(html, currentConfig);
        html = scripts.html;
        if (!scripts.requirejs) {
            if (currentConfig.appends) {
                html = handleAppends(html, currentConfig.appends);
            }
        }

        return html;

        function handlePrepends(html, prepends) {
            var htmlArr = ['<head>'], i;
            for (i=0; i<prepends.length; i++) {
                createScriptTagForPrependOrAppend(htmlArr, prepends[i]);
            }
            return html.replace(/<head>/, htmlArr.join(''));
        }

        function handleAppends(html, appends) {
            var htmlArr = [], i;
            for (i=0; i<appends.length; i++) {
                createScriptTagForPrependOrAppend(htmlArr, appends[i]);
            }
            htmlArr.push('</body>');
            return html.replace(/<\/body>/, htmlArr.join(''));
        }

        function createScriptTagForPrependOrAppend(html, prependOrAppend) {
            if (isString(prependOrAppend)) {
                html.push(docUtils.urlScriptHtml(prependOrAppend));
            } else {
                html.push(docUtils.contentScriptHtml(createRemoteCallExpression(injectedCallback(prependOrAppend), 'window')));
            }
        }

        function injectedCallback(prepend) {
            return function(win) {
                return injector.inject(prepend, win, [win]);
            };
        }

        function handleScripts(html, config) {
            var requirejs = false;
            html = docUtils.replaceScripts(html, function(scriptUrl, textContent, scriptTag) {
                if (!scriptUrl) return;
                
                if (scriptUrl.match(REQUIRE_JS_RE)) {
                    requirejs = true;
                    return docUtils.contentScriptHtml(createRemoteCallExpression(function(win) {
                        handleRequireJsScript(win, scriptUrl, scriptTag, config);
                    }, "window"));
                }

                var matchingIntercepts = findMatchingIntercepts(scriptUrl, config.intercepts);
                if (!matchingIntercepts.empty) {
                    return docUtils.contentScriptHtml(createRemoteCallExpression(function(win) {
                        handleInterceptScript(win, matchingIntercepts, scriptUrl);
                    }, "window"));
                }
            });

            return {
                requirejs: requirejs,
                html: html
            };
        }

        function handleRequireJsScript(win, scriptUrl, scriptTag, config) {
            // TODO extract data-main from script-Tag and call require!
            docUtils.loadAndEvalScriptSync(win, scriptUrl);
            var originalRequire = win.require;
            patchedRequire.config = originalRequire.config;
            win.require = patchedRequire;

            var _load = originalRequire.load;
            originalRequire.load = patchedLoad;
            var dataMain = scriptTag.match(/data-main=\"([^\"]*)/);
            if (dataMain) {
                originalRequire.call(win, [dataMain[1]]);
            }

            function patchedRequire(deps, originalCallback) {
                originalRequire(deps, function () {
                    var i;
                    for (i=0; i<config.appends.length; i++) {
                        execAppend(config.appends[i]);
                    }
                    return originalCallback.apply(this, arguments);
                });
            }

            function execAppend(append) {
                if (isString(append)) {
                    docUtils.loadAndEvalScriptSync(win, append);
                } else {
                    injector.inject(append, win, [win]);
                }
            }

            function patchedLoad(context, moduleName, url) {
                var matchingIntercepts = findMatchingIntercepts(url, config.intercepts);
                if (matchingIntercepts.empty) {
                    return _load.apply(this, arguments);
                }
                try {
                    handleInterceptScript(win, matchingIntercepts, url);
                    context.completeLoad(moduleName);
                } catch (error) {
                    //Set error on module, so it skips timeout checks.
                    context.registry[moduleName].error = true;
                    throw error;
                }
            }
        }

        function findMatchingIntercepts(url, intercepts) {
            var i, matchingIntercepts = { empty: true };
            if (!intercepts) return matchingIntercepts;
            for (i=0; i<intercepts.length; i++) {
                if (intercepts[i].scriptUrl===url) {
                    matchingIntercepts[intercepts[i].fnName] = intercepts[i];
                    matchingIntercepts.empty = false;
                }
            }
            return matchingIntercepts;
        }

        function handleInterceptScript(win, matchingInterceptsByName, scriptUrl) {
            // Need to do the xhr in sync here so the script execution order in the document
            // stays the same!
            docUtils.loadScript(win, scriptUrl, resultCallback, false);

            function resultCallback(error, data) {
                if (error) {
                    throw error;
                }
                data = data.replace(NAMED_FUNCTION_RE, function(all, fnName) {
                    if (matchingInterceptsByName[fnName]) {
                        return all+'if (!'+fnName+'.delegate)return '+
                            createRemoteCallExpression(fnCallback, "window", fnName, "this", "arguments");
                    }
                    return all;

                    function fnCallback(win, fn, self, args) {
                        var originalArgNames = injector.annotate(fn),
                            originalArgsByName = {},
                            $delegate = {fn:fn, name: fnName, self: self, args: args},
                            i;
                        for (i=0; i<args.length; i++) {
                            originalArgsByName[originalArgNames[i]] = args[i];
                        }
                        fn.delegate = true;
                        try {
                            return injector.inject(matchingInterceptsByName[fnName].callback,
                                self, [originalArgsByName, {$delegate: $delegate}, win]);
                        } finally {
                            fn.delegate = false;
                        }
                    }
                });

                docUtils.evalScript(win, data);
            }
        }

    }

    function isString(obj) {
        return obj && obj.slice;
    }

    exports = {
        init: init,
        instrument: instrument,
        deactivateAndCaptureHtml: deactivateAndCaptureHtml,
        serializeDocType: docUtils.serializeDocType,
        serializeHtmlTag: docUtils.serializeHtmlTag,
        modifyHtmlWithConfig: modifyHtmlWithConfig,
        rewriteDocument: docUtils.rewriteDocument,
        replaceScripts: docUtils.replaceScripts,
        global: {
            uitest: {
                instrument: instrument
            }
        }
    };
    return exports;
});
uitest.define('logger', ['global'], function(global) {

    function log() {
        return global.console.log.apply(global.console, arguments);
    }

    return {
        log: log
    };
});

uitest.define('ready', ['logger', 'global'], function(logger, global) {

	var registeredSensors = {};

	function registerSensor(name, sensorFactory) {
		registeredSensors[name] = sensorFactory;
	}

	function createSensors(config) {
		var i, sensorNames = config.readySensors,
			sensorName,
			readySensorInstances = {},
			newPrepends = [];
		var api = {
			prepend: function(value) {
				newPrepends.push(value);
			},
			append: function(value) {
				config.appends.push(value);
			}
		};
		for(i = 0; i < sensorNames.length; i++) {
			sensorName = sensorNames[i];
			readySensorInstances[sensorName] = registeredSensors[sensorName](api);
		}
		// Be sure that the prepends of the sensors are always before all
		// other prepends!
		config.prepends.unshift.apply(config.prepends, newPrepends);

		return readySensorInstances;
	}

	// Goal:
	// - Detect async work that cannot detected before some time after it's start
	//   (e.g. the WebKitAnimationStart event is not fired until some ms after the dom change that started the animation).
	// - Detect the situation where async work starts another async work
	//
	// Algorithm:
	// Wait until all readySensors did not change for 50ms.


	function ready(sensorInstances, listener) {
		var sensorStatus;

		function restart() {
			sensorStatus = aggregateSensorStatus(sensorInstances);
			if(sensorStatus.busySensors.length !== 0) {
				logger.log("ready waiting for [" + sensorStatus.busySensors + "]");
				global.setTimeout(restart, 20);
			} else {
				global.setTimeout(ifNoAsyncWorkCallListenerElseRestart, 50);
			}
		}

		function ifNoAsyncWorkCallListenerElseRestart() {
			var currentSensorStatus = aggregateSensorStatus(sensorInstances);
			if(currentSensorStatus.busySensors.length === 0 && currentSensorStatus.count === sensorStatus.count) {
				listener();
			} else {
				restart();
			}
		}

		restart();
	}

	function aggregateSensorStatus(sensorInstances) {
		var count = 0,
			busySensors = [],
			sensorName, sensor, sensorStatus;
		for(sensorName in sensorInstances) {
			sensor = sensorInstances[sensorName];
			sensorStatus = sensor();
			count += sensorStatus.count;
			if(!sensorStatus.ready) {
				busySensors.push(sensorName);
			}
		}
		return {
			count: count,
			busySensors: busySensors
		};
	}

	return {
		registerSensor: registerSensor,
		createSensors: createSensors,
		ready: ready
	};
});
uitest.define('urlLoader', ['urlParser', 'global'], function(urlParser, global) {

    var REFRESH_URL_ATTRIBUTE = 'uitr',
        WINDOW_ID = 'uitestwindow',
        frameElement,
        frameWindow,
        popupWindow,
        openCounter = 0;

    function navigateWithReloadTo(win, url) {
        var parsedUrl = urlParser.parseUrl(url);
        urlParser.setOrReplaceQueryAttr(parsedUrl, REFRESH_URL_ATTRIBUTE, openCounter++);
        win.location.href = urlParser.serializeUrl(parsedUrl);
    }

    function open(config) {
        var remoteWindow;
        if (config.loadMode === 'popup') {
            if (!popupWindow) {
                popupWindow = global.open('', WINDOW_ID);
            }
            remoteWindow = popupWindow;
        } else if (config.loadMode === 'iframe') {
            if (!frameWindow) {
                frameElement = global.document.createElement("iframe");
                frameElement.name = WINDOW_ID;
                frameElement.setAttribute("width", "100%");
                frameElement.setAttribute("height", "100%");
                var winSize = {
                    width: window.innerWidth,
                    height: window.innerHeight
                };
                frameElement.setAttribute("style", "position: absolute; z-index: 10; bottom: 0; left: 0; pointer-events:none;");
                var body = global.document.body;
                body.appendChild(frameElement);
                frameWindow = frameElement.contentWindow || frameElement.contentDocument;
            }
            remoteWindow = frameWindow;
        }
        navigateWithReloadTo(remoteWindow, config.url);
        return remoteWindow;
    }

    function close() {
        if (frameElement) {
            frameElement.parentElement.removeChild(frameElement);
            frameElement = null;
            frameWindow = null;
        }
        if (popupWindow) {
            popupWindow.close();
            popupWindow = null;
        }
    }

    return {
        open: open,
        navigateWithReloadTo: navigateWithReloadTo,
        close: close
    };
});

uitest.define('urlParser', [], function () {
    function parseUrl(url) {
        var hashIndex = url.indexOf('#');
        var hash;
        var query = '';
        if (hashIndex != -1) {
            hash = url.substring(hashIndex + 1);
            url = url.substring(0, hashIndex);
        }
        var queryIndex = url.indexOf('?');
        if (queryIndex != -1) {
            query = url.substring(queryIndex + 1);
            url = url.substring(0, queryIndex);
        }
        return {
            baseUrl:url,
            hash:hash,
            query:query ? query.split('&') : []
        };
    }

    function serializeUrl(parsedUrl) {
        var res = parsedUrl.baseUrl;
        if (parsedUrl.query && parsedUrl.query.length) {
            res += '?' + parsedUrl.query.join('&');
        }
        if (parsedUrl.hash) {
            res += '#' + parsedUrl.hash;
        }
        return res;
    }

    function setOrReplaceQueryAttr(parsedUrl, attr, value) {
        var newQueryEntry = attr + '=' + value;
        var query = parsedUrl.query;
        for (var i = 0; i < query.length; i++) {
            if (query[i].indexOf(attr) === 0) {
                query[i] = newQueryEntry;
                return;
            }
        }
        query.push(newQueryEntry);
    }

    return {
        setOrReplaceQueryAttr:setOrReplaceQueryAttr,
        parseUrl:parseUrl,
        serializeUrl:serializeUrl
    };
});

uitest.define('intervalSensor', ['ready'], function(ready) {
    
    ready.registerSensor('interval', sensorFactory);

    function sensorFactory(config) {
        var intervals = {},
            intervalStartCounter = 0;

        config.prepend(function(window) {
            var oldInterval = window.setInterval;
            window.setInterval = function (fn, time) {
                var handle = oldInterval(fn, time);
                intervals[handle] = true;
                intervalStartCounter++;
                return handle;
            };

            var oldClearInterval = window.clearInterval;
            window.clearInterval = function (code) {                
                oldClearInterval(code);
                delete intervals[code];
            };
        });

        return state;

        function isReady() {
            var x;
            for (x in intervals) {
                return false;
            }
            return true;
        }

        function state() {
            return {
                count: intervalStartCounter,
                ready: isReady()
            };
        }        
    }

    return {
        sensorFactory: sensorFactory
    };
});

uitest.define('jqmAnimationSensor', ['ready'], function(ready) {

    ready.registerSensor('$animation', sensorFactory);

    function sensorFactory(config) {
        var ready = true,
            startCounter = 0;

        config.append(function(window) {
            var jQuery = window.jQuery;
            if(!(jQuery && jQuery.fn && jQuery.fn.animationComplete)) {
                return;
            }

            var oldFn = jQuery.fn.animationComplete;
            jQuery.fn.animationComplete = function(callback) {
                startCounter++;
                ready = false;
                return oldFn.call(this, function() {
                    ready = true;
                    return callback.apply(this, arguments);
                });
            };
        });

        return state;

        function state() {
            return {
                count: startCounter,
                ready: ready
            };
        }
    }

    return {
        sensorFactory: sensorFactory
    };
});
uitest.define('loadSensor', ['ready'], function(ready) {
	var LOAD_SENSOR_NAME = "load";

	function loadSensorFactory(installer) {
		var count = 0,
			ready, doc, waitForDocComplete;
		
		init();
		installer.append(function(document) {
			doc = document;
			waitForDocComplete = true;
		});
		return loadSensor;

		function init() {
			ready = false;
			waitForDocComplete = false;
		}

		function loadSensor(reload) {
			if (waitForDocComplete && doc.readyState==='complete') {
				waitForDocComplete = false;
				ready = true;
			}
			if(reload) {
				count++;
				init();
			}
			return {
				count: count,
				ready: ready
			};
		}
	}

	function waitForReload(sensorInstances) {
		sensorInstances[LOAD_SENSOR_NAME](true);
	}

	ready.registerSensor(LOAD_SENSOR_NAME, loadSensorFactory);

	return {
		sensorFactory: loadSensorFactory,
		sensorName: LOAD_SENSOR_NAME,
		waitForReload: waitForReload
	};
});

uitest.define('timeoutSensor', ['ready'], function(ready) {
    
    ready.registerSensor('timeout', sensorFactory);

    function sensorFactory(config) {
        var timeouts = {},
            timoutStartCounter = 0;

        config.prepend(function(window) {
            var oldTimeout = window.setTimeout;
            window.setTimeout = function (fn, time) {
                var handle;
                var callback = function () {
                    delete timeouts[handle];
                    if (typeof fn == 'string') {
                        window.eval(fn);
                    } else {
                        fn();
                    }
                };
                handle = oldTimeout(callback, time);
                timeouts[handle] = true;
                timoutStartCounter++;
                return handle;
            };

            var oldClearTimeout = window.clearTimeout;
            window.clearTimeout = function (code) {                
                oldClearTimeout(code);
                delete timeouts[code];
            };
        });

        return state;

        function isReady() {
            var x;
            for (x in timeouts) {
                return false;
            }
            return true;
        }

        function state() {
            return {
                count: timoutStartCounter,
                ready: isReady()
            };
        }        
    }

    return {
        sensorFactory: sensorFactory
    };
});

uitest.define('xhrSensor', ['ready'], function(ready) {

    ready.registerSensor('xhr', sensorFactory);

    function sensorFactory(config) {
        var ready = true,
            startCounter = 0;

        config.prepend(function(window) {
            var copyStateFields = ['readyState', 'responseText', 'responseXML', 'status', 'statusText'];
            var proxyMethods = ['abort', 'getAllResponseHeaders', 'getResponseHeader', 'open', 'send', 'setRequestHeader'];

            var oldXHR = window.XMLHttpRequest;
            var DONE = 4;
            var newXhr = function() {
                    var self = this;
                    this.origin = new oldXHR();

                    function copyState() {
                        for(var i = 0; i < copyStateFields.length; i++) {
                            var field = copyStateFields[i];
                            try {
                                self[field] = self.origin[field];
                            } catch(_) {}
                        }
                    }

                    function proxyMethod(name) {
                        self[name] = function() {
                            if(name == 'send') {
                                ready = false;
                                startCounter++;
                            } else if(name == 'abort') {
                                ready = true;
                            }
                            var res = self.origin[name].apply(self.origin, arguments);
                            copyState();
                            return res;
                        };
                    }

                    for(var i = 0; i < proxyMethods.length; i++) {
                        proxyMethod(proxyMethods[i]);
                    }
                    this.origin.onreadystatechange = function() {
                        if(self.origin.readyState == DONE) {
                            ready = true;
                        }
                        copyState();
                        if(self.onreadystatechange) {
                            self.onreadystatechange.apply(self.origin, arguments);
                        }
                    };
                    copyState();
                };
            window.XMLHttpRequest = newXhr;
        });

        return state;

        function state() {
            return {
                count: startCounter,
                ready: ready
            };
        }
    }

    return {
        sensorFactory: sensorFactory
    };
});

uitest.define('jasmineSugar', ['facade', 'global'], function(facade, global) {

    if (!global.jasmine) {
        return {};
    }

    function currentIdAccessor() {
        var ids = [],
            env = global.jasmine.getEnv(),
            spec = env.currentSpec,
            suite = env.currentSuite;
        // Note for the check of spec.queue.running: 
        // Jasmine leaves env.currentSpec filled even if outside
        // of any spec from the last run!
        if (spec && spec.queue.running) {
            ids.unshift(spec.id);
            suite = spec.suite;
        }
        while (suite) {
            ids.unshift(suite.id);
            suite = suite.parentSuite;
        }        
        return ids.join(".");
    }

    facade.currentIdAccessor(currentIdAccessor);

    function runs(callback, timeout) {
        var ready = false;
        global.runs(function() {
            facade.current.ready(function() {
                ready = true;
            });
        });
        global.waitsFor(function() {
            return ready;
        }, "waiting for uitest.ready", timeout);
        global.runs(function() {
            facade.current.inject(callback);
        });
    }

    return {
        currentIdAccessor: currentIdAccessor,
        runs: runs,
        global: {
            uitest: {
                runs: runs
            }
        }
    };
});

/* Main */
(function () {
    uitest.require.all();
})();


