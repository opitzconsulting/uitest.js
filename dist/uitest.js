/*! uitest.js - v0.10.0-SNAPSHOT - 2013-04-18
* https://github.com/tigbro/uitest.js
* Copyright (c) 2013 Tobias Bosch; Licensed MIT */
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
        if (arguments.length === 2) {
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

    function findModuleDefinition(name) {
        for (var i = 0; i < define.moduleDefs.length; i++) {
            var mod = define.moduleDefs[i];
            if (mod.name === name) {
                return mod;
            }
        }
        throw new Error("Could not find the module " + name);
    }

    define.findModuleDefinition = findModuleDefinition;

    function factory(name, instanceCache) {
        if (!instanceCache) {
            instanceCache = {};
        }
        if (name==="moduleCache") {
            return instanceCache;
        }
        if (instanceCache[name] === undefined) {
            var resolvedValue;
            var mod = findModuleDefinition(name);
            var resolvedDeps = listFactory(mod.deps, instanceCache);
            resolvedValue = mod.value;
            if (typeof mod.value === 'function') {
                resolvedValue = mod.value.apply(window, resolvedDeps);
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

    var require = function (cache, deps, callback) {
        var filteredDeps = [],
            i, def;
        if (arguments.length===1) {
            deps = cache;
            cache = {};
            callback = null;
        } else if (arguments.length===2) {
            if (typeof cache === 'function' || cache.slice) {
                callback = deps;
                deps = cache;
            }
        }
        if (deps.apply) {
            // if deps is a function, treat it as a filter function.
            for (i = 0; i < define.moduleDefs.length; i++) {
                def = define.moduleDefs[i];
                if (deps(def.name)) {
                    filteredDeps.push(def.name);
                }
            }
            deps = filteredDeps;
        }
        var resolvedDeps = listFactory(deps, cache);

        if (callback) {
            callback.apply(this, resolvedDeps);
        }

        return cache;
    };

    ns.require = require;
    ns.define = define;

})(window);

uitest.define('annotate', ['utils'], function(utils) {

    // Copied from https://github.com/angular
    var FN_ARGS = /^function\s*[^\(]*\(\s*([^\)]*)\)/m;
    var FN_ARG_SPLIT = /,/;
    var FN_ARG = /^\s*(_?)(\S+?)\1\s*$/;
    var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;

    function annotate(fn) {
        var $inject, fnText, argDecl, last, args, i;

        if(typeof fn === 'function') {
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
        } else if(utils.isArray(fn)) {
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
        if(acceptArrayAnnotation && utils.isArray(arg)) {
            arg = arg[arg.length - 1];
        }
        assertArg(utils.isFunction(arg), name, 'not a function, got ' + (arg && typeof arg === 'object' ? arg.constructor.name || 'Object' : typeof arg));
        return arg;
    }

    return annotate;
});
uitest.define('config', [], function() {
	function create() {
		return new Create();
	}

	function Create() {
		this._data = {};
	}

	Create.prototype = {
		parent: simpleProp("_parent"),
		sealed: simpleProp("_sealed"),
		url: dataProp("url"),
		trace: dataProp("trace"),
		feature: dataAdder("features", featureValidator),
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
			if (checkFn) {
				checkFn(newValue);
			}
			this._data[name] = newValue;
		});
	}

	function dataAdder(name, checkFn) {
		return getterSetter(function() {
			return this._data[name];
		}, function() {
			var values = Array.prototype.slice.call(arguments),
				arr = this._data[name];
			checkNotSealed(this);
			if (checkFn) {
				checkFn(values);
			}
			if (!arr) {
				arr = this._data[name] = [];
			}
			arr.push.apply(arr, values);
		});
	}

	function featureValidator(features) {
		var i;
		for (i=0; i<features.length; i++) {
			if (!uitest.define.findModuleDefinition("run/feature/"+features[i])) {
				throw new Error("Unknown feature: "+features[i]);
			}
		}
	}

	function checkNotSealed(self) {
		if (self.sealed()) {
			throw new Error("This configuration cannot be modified.");
		}
	}

	function buildConfig(target) {
		target = target || {
			features: [],
			appends: [],
			prepends: [],
			intercepts: []
		};
		if (this.parent()) {
			this.parent().buildConfig(target);
		}
		var prop, value, oldValue,
            data = this._data;
		for(prop in data) {
			value = data[prop];
			if(isArray(value)) {
				value = (target[prop] || []).concat(value);
			}
			target[prop] = value;
		}
		return target;
	}

	function isArray(obj) {
		return obj && obj.push;
	}

	return {
		create: create
	};
});
uitest.define('documentUtils', ['global'], function(global) {

    function serializeDocType(doc) {
        var node = doc.doctype;
        if(!node) {
            return '';
        }
        return "<!DOCTYPE " + node.name + (node.publicId ? ' PUBLIC "' + node.publicId + '"' : '') + (!node.publicId && node.systemId ? ' SYSTEM' : '') + (node.systemId ? ' "' + node.systemId + '"' : '') + '>';
    }

    function serializeHtmlTag(docEl) {
        var i, attr;
        var parts = ['<html'];
        for(i = 0; i < docEl.attributes.length; i++) {
            attr = docEl.attributes[i];
            if (attr.specified) {
                if(attr.value) {
                    parts.push(attr.name + '="' + attr.value + '"');
                } else {
                    parts.push(attr.name);
                }
            }
        }
        return parts.join(" ") + ">";
    }

    function loadFile(url, resultCallback) {
        var xhr = new global.XMLHttpRequest();
        xhr.onreadystatechange = function() {
            if(xhr.readyState === 4) {
                if(xhr.status === 200 || xhr.status === 0) {
                    resultCallback(null, xhr.responseText);
                } else {
                    resultCallback(new Error("Error loading url " + url + ":" + xhr.statusText));
                }
            }
        };
        xhr.open("GET", url, true);
        xhr.send();
    }

    function loadScript(url, resultCallback) {
        loadFile(url, function(error, data) {
            if (!error) {
                resultCallback(null, data+"//@ sourceURL=" + url);
            } else {
                resultCallback(error, data);
            }
        });
    }

    function evalScript(win, scriptContent) { /*jshint evil:true*/
        win["eval"].call(win, scriptContent);
    }

    function addEventListener(target, type, callback) {
        if (target.nodeName && target.nodeName.toLowerCase() === 'iframe' && type==='load') {
            // Cross browser way for onload iframe handler
            if (target.attachEvent) {
                target.attachEvent('onload', callback);
            } else {
                target.onload = callback;
            }
        } else if (target.addEventListener) {
            target.addEventListener(type, callback, false);
        } else {
            target.attachEvent("on"+type, callback);
        }
    }

    function removeEventListener(target, type, callback) {
        if (target[type]===callback) {
            target[type] = null;
        }
        if (target.removeEventListener) {
            target.removeEventListener(type, callback, false);
        } else {
            target.detachEvent("on"+type, callback);
        }
    }

    function textContent(el, val) {
        if ("text" in el) {
            el.text = val;
        } else {
            if ("innerText" in el) {
                el.innerHTML = val;
            } else {
                el.textContent = val;
            }
        }
    }

    return {
        serializeDocType: serializeDocType,
        serializeHtmlTag: serializeHtmlTag,
        loadFile: loadFile,
        evalScript: evalScript,
        loadScript: loadScript,
        addEventListener: addEventListener,
        removeEventListener: removeEventListener,
        textContent: textContent
    };
});
uitest.define('facade', ['config', 'global', 'sniffer'], function(config, global, sniffer) {
    var CONFIG_FUNCTIONS = ['parent', 'url', 'loadMode', 'feature', 'append', 'prepend', 'intercept', 'trace'],
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
                    if (!parentId || id.length>parentId.length) {
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
        if(!self._runModules) {
            run(self, function() {
                self._runModules["run/ready"].ready(callback);
            });
        } else {
            self._runModules["run/ready"].ready(callback);
        }
    }

    function run(self, finishedCb) {
        var config, featureName, featureModules, i;
        sniffer(function(sniffedData) {
            self._config.sealed(true);
            config = self._config.buildConfig();
            self._runModules = {
                "run/config": config,
                "run/sniffer": sniffedData
            };

            uitest.require(self._runModules, function(moduleName) {
                if (moduleName.indexOf('run/')!==0) {
                    return false;
                }
                if (moduleName.indexOf('run/feature/')===0) {
                    return false;
                }
                return true;
            });
            featureModules = [];
            for (i=0; i<config.features.length; i++) {
                featureName = config.features[i];
                featureModules.push(featureModule(featureName));
            }
            uitest.require(self._runModules, featureModules);
            finishedCb();
        });


    }

    function featureModule(featureName) {
        return "run/feature/"+featureName;
    }

    function reloaded(callback) {
        checkRunning(this);
        this._runModules["run/loadSensor"].reloaded(callback);
    }

    function inject(callback) {
        checkRunning(this);
        var injector = this._runModules["run/injector"];
        return injector.inject(callback, null, []);
    }

    function checkRunning(self) {
        if(!self._runModules) {
            throw new Error("The test page has not yet loaded. Please call ready first");
        }
    }

    current = createCurrentFacade();

    return {
        create: create,
        current: current,
        currentIdAccessor: currentIdAccessor,
        global: {
            uitest: {
                create: create,
                current: current
            }
        }
    };
});
uitest.define('global', [], function() {
	return window;
});

uitest.define('htmlParserFactory', ['regexParserFactory'], function(regexParserFactory) {
    var COMMENT = "comment",
        CONTENT_SCRIPT = "contentscript",
        URL_SCRIPT = "urlscript",
        HEAD_START = "headstart",
        BODY_START = "bodystart",
        BODY_END = "bodyend",
        EMPTY_TAG_RE = /(<([^>\s]+)[^>]*)\/>/ig;

    return factory;

    function factory() {
        var parser = regexParserFactory();
        parser.addTokenType(COMMENT, "(<!--)((?:[^-]|-[^-])*?)(-->)", "<!---->", {1:"content"});
        parser.addTokenType(URL_SCRIPT, '(<script)([^>]*)(\\s+src\\s*=\\s*")([^"]*)(")([^>]*)(>[\\s\\S]*?</script>)', '<script src=""></script>', {1:"preAttrs", 3:"src", 5:"postAttrs"});
        parser.addTokenType(CONTENT_SCRIPT, "(<script)([^>]*)(>)([\\s\\S]*?)(</script>)", "<script></script>", {1:"attrs", 3:"content"});
        parser.addTokenType(HEAD_START, "(<head[^>]*>)", "<head>", []);
        parser.addTokenType(BODY_START, "(<body[^>]*>)", "<body>", []);
        parser.addTokenType(BODY_END, "(<\\s*/\\s*body\\s*>)", "</body>", []);

        var _parse = parser.parse,
            _transform = parser.transform;

        parser.parse = function(input) {
            input = makeEmptyTagsToOpenCloseTags(input);
            return _parse(input);
        };

        parser.transform = function(input, state, processors, resultCallback) {
            input = makeEmptyTagsToOpenCloseTags(input);
            return _transform(input, state, processors, resultCallback);
        };

        return parser;
    }

    // We unpack empty tags to open/close tags here,
    // so we have a normalized form for empty tags.
    // Also, we need html and not xhtml for rewriting a document
    // using script urls / document.open.
    function makeEmptyTagsToOpenCloseTags(html) {
        return html.replace(EMPTY_TAG_RE, function(match, openTag, tagName) {
            return openTag+"></"+tagName+">";
        });
    }
});

uitest.define('jsParserFactory', ['regexParserFactory'], function(regexParserFactory) {
    var SINGLE_QUOTE_STRING = "sqstring",
        DOUBLE_QUOTE_STRING = "dqstring",
        LINE_COMMENT = "linecomment",
        BLOCK_COMMENT = "blockcomment",
        FUNCTION_START = "functionstart";

    return factory;

    function factory() {
        var parser = regexParserFactory();

        parser.addTokenType(SINGLE_QUOTE_STRING, "(')((?:[^'\\\\]|\\\\.)*)(')", "''", {1: "content"});
        parser.addTokenType(DOUBLE_QUOTE_STRING, '(")((?:[^"\\\\]|\\\\.)*)(")', '""', {1: "content"});
        parser.addTokenType(LINE_COMMENT, "(//)(.*)($)", "//", {1:"content"});
        parser.addTokenType(BLOCK_COMMENT, "(/\\*)([\\s\\S]*)(\\*/)", "/**/", {1: "content"});
        parser.addTokenType(FUNCTION_START, "(\\bfunction\\s*)(\\w+)([^\\{]*\\{)", "function fn(){", {1:"name"});

        return parser;
    }
});

uitest.define('regexParserFactory', ['utils'], function(utils) {

    return factory;

    function factory() {
        var types = [],
            typesByName = {};

        return {
            parse: parse,
            serialize: serialize,
            transform: transform,
            addTokenType: addTokenType,
            addSimpleTokenType: addSimpleTokenType,
            assertAllCharsInExactOneCapturingGroup: assertAllCharsInExactOneCapturingGroup
        };

        function addSimpleTokenType(name) {
            addTokenType(name, "(\\b" + name + "\\b)", name, {});
        }

        function addTokenType(name, reString, template, groupNames) {
            var templateMatch = new RegExp("^" + reString + "$", "i").exec(template);
            if (!templateMatch) {
                throw new Error("Template '" + template + "' does not match the regex '" + reString+"'");
            }
            assertAllCharsInExactOneCapturingGroup(reString);
            var groupCount = templateMatch.length-1;
            var type = {
                name: name,
                reString: reString,
                re: new RegExp(reString, "i"),
                groupNames: groupNames,
                groupCount: groupCount,
                template: template
            };
            types.push(type);
            typesByName[name] = type;
        }

        function parse(input) {
            var re = createRegex(),
                match,
                result = [],
                lastMatchEnd = 0;

            while (match = re.exec(input)) {
                addOtherTokenBetweenMatches();
                addMatch();
            }
            addTailOtherToken();
            return result;

            function createRegex() {
                var re = [],
                    i;
                for (i = 0; i < types.length; i++) {
                    if (re.length > 0) {
                        re.push("|(");
                    } else {
                        re.push("(");
                    }
                    re.push(types[i].reString, ")");
                }
                return new RegExp(re.join(""), "ig");
            }

            function addOtherTokenBetweenMatches() {
                if (match.index > lastMatchEnd) {
                    result.push({
                        type: 'other',
                        match: input.substring(lastMatchEnd, match.index)
                    });
                }
                lastMatchEnd = match.index + match[0].length;
            }

            function addMatch() {
                var i,
                groupIndex,
                type,
                parsedMatch = {
                    match: match[0]
                };
                lastMatchEnd = match.index + match[0].length;
                groupIndex = 1;
                for (i = 0; i < types.length; i++) {
                    if (match[groupIndex]) {
                        type = types[i];
                        break;
                    }
                    groupIndex += types[i].groupCount + 1;
                }
                if (!type) {
                    throw new Error("could not determine the type for match " + match);
                }
                parsedMatch.type = type.name;
                groupIndex++;
                for (i = 0; i < type.groupCount; i++) {
                    if (type.groupNames[i]) {
                        parsedMatch[type.groupNames[i]] = match[groupIndex];
                    }
                    groupIndex++;
                }
                result.push(parsedMatch);
            }

            function addTailOtherToken() {
                if (lastMatchEnd < input.length) {
                    result.push({
                        type: 'other',
                        match: input.substring(lastMatchEnd)
                    });
                }
            }
        }

        function serialize(parsed) {
            var i, token, result = [];
            for (i = 0; i < parsed.length; i++) {
                token = parsed[i];
                serializeToken(token);
            }
            return result.join('');

            function serializeToken(token) {
                if (token.type === 'other') {
                    result.push(token.match);
                    return;
                }
                var type = typesByName[token.type];
                var input = token.match || type.template;
                var match = type.re.exec(input);
                var i, groupName;
                for (i = 1; i < match.length; i++) {
                    groupName = type.groupNames[i-1];
                    if (groupName) {
                        result.push(token[groupName]);
                    } else {
                        result.push(match[i]);
                    }
                }
            }
        }

        function transform(input, state, listeners, doneCallback) {
            var tokens = parse(input),
                resultTokens = [];
            state = state || {};

            utils.asyncLoop(tokens, tokenHandler, done, stop);

            function stop(error) {
                if (error) {
                    doneCallback(error);
                }
            }

            function done() {
                doneCallback(null, serialize(resultTokens));
            }

            function tokenHandler(tokenIndex, token, control) {
                utils.processAsyncEvent({
                    token: token,
                    state: state,
                    pushToken: pushToken
                },listeners,tokenDone,tokenStop);

                function tokenDone() {
                    resultTokens.push(token);
                    control.next();
                }

                function tokenStop(error) {
                    if (error) {
                        control.stop(error);
                    } else {
                        control.next();
                    }
                }
                function pushToken(token) {
                    tokens.splice(tokenIndex+1,0,token);
                }
            }
        }
    }

    function assertAllCharsInExactOneCapturingGroup(reString) {
        var groups = [], i, ch, nextEscaped, capturing, skipCheck;

        for (i = 0; i < reString.length; i++) {
            skipCheck = false;
            ch = reString.charAt(i);
            if (ch === '(' && !nextEscaped) {
                capturing = true;
                if (reString.charAt(i + 1) === '?') {
                    i+=2;
                    capturing = false;
                    skipCheck = true;
                }
                groups.push(capturing);
            } else if (ch === ')' && !nextEscaped) {
                groups.pop();
                if (reString.charAt(i+1)==='?') {
                    i++;
                }
                skipCheck = true;
            }
            if (!nextEscaped && ch==='\\') {
                nextEscaped = true;
            } else {
                nextEscaped = false;
            }
            if (capturingGroupCount()!==1 && !skipCheck) {
                throw new Error("Regex "+reString+" does not have exactly one capturing group at position "+i);
            }
        }

        function capturingGroupCount() {
            var count = 0, i;
            for (i=0; i<groups.length; i++) {
                if (groups[i]) {
                    count++;
                }
            }
            return count;
        }
    }
});
uitest.define("run/feature/angularIntegration", ["run/injector", "run/config"], function(injector, runConfig) {
    runConfig.appends.push(install);

    function install(angular, window) {
        if(!angular) {
            throw new Error("Angular is not loaded!");
        }

        var ng = angular.module("ng");

        installE2eMock(angular, ng);
        adaptPrototypes(ng, window);
        addAngularInjector(ng);
    }

    function addAngularInjector(ng) {
        ng.run(function($injector) {
            injector.addDefaultResolver(angularResolver);

            function angularResolver(argName) {
                try {
                    return $injector.get(argName);
                } catch(e) {
                    return undefined;
                }
            }
        });
    }

    function installE2eMock(angular, ng) {
        ng.config(function($provide) {
            if(angular.mock) {
                // disable auto-flushing by removing the $browser argument,
                // so we can control flushing using $httpBackend.flush()!
                angular.mock.e2e.$httpBackendDecorator.splice(1, 1);
                // enable the mock backend
                $provide.decorator('$httpBackend', angular.mock.e2e.$httpBackendDecorator);
            }
        });
    }

    // -----
    // Angular uses "instanceof Array" only at 3 places,
    // which can generically be decorated.
    function adaptPrototypes(ng, win) {
        function convertArr(inArr) {
            // On Android 2.3, just calling new win.Array() is not enough
            // to yield outArr instanceof win.Array.
            // Also, every call to "push" will also change the prototype somehow...
            /*jshint evil:true*/
            if (!inArr) {
                return inArr;
            }
            var outArr = win["eval"]("new Array("+inArr.length+")"),
                i;
            for (i=0; i<inArr.length; i++) {
                outArr[i] = inArr[i];
            }
            return outArr;
        }

        function adaptPrototypesInFilter($provide, filterName) {
            $provide.decorator(filterName, function($delegate) {
                return function() {
                    var args = Array.prototype.slice.call(arguments);
                    args[0] = convertArr(args[0]);
                    return $delegate.apply(this, args);
                };
            });
        }

        ng.config(function($provide) {
            adaptPrototypesInFilter($provide, "filterFilter");
            adaptPrototypesInFilter($provide, "limitToFilter");
            adaptPrototypesInFilter($provide, "orderByFilter");
        });
    }
});
uitest.define('run/feature/cacheBuster', ['documentUtils', 'run/htmlInstrumentor', 'run/logger', 'utils', 'urlParser', 'run/requirejsInstrumentor'], function(docUtils, docInstrumentor, logger, utils, urlParser, requirejsInstrumentor) {

    var now = utils.testRunTimestamp();
    logger.log("forcing script refresh with timestamp "+now);

    htmlPreProcessor.priority = 9999;
    docInstrumentor.addPreProcessor(htmlPreProcessor);
    requirejsEventHandler.priority = 9999;
    requirejsInstrumentor.addEventListener(requirejsEventHandler);

    return {
        htmlPreProcessor: htmlPreProcessor,
        requirejsEventHandler: requirejsEventHandler
    };

    function requirejsEventHandler(event, control) {
        if (event.type==='load') {
            event.url = urlParser.cacheBustingUrl(event.url, now);
        }
        control.next();
    }

    function htmlPreProcessor(event, control) {
        if (event.token.type==='urlscript') {
            event.token.src = urlParser.cacheBustingUrl(event.token.src, now);
        }
        control.next();
    }
});


uitest.define('run/feature/intervalSensor', ['run/config', 'run/ready'], function(runConfig, readyModule) {
    var intervals = {},
        intervalStartCounter = 0;

    runConfig.prepends.unshift(install);
    readyModule.addSensor('interval', state);
    return state;

    function install(window) {
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
    }

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
});

uitest.define('run/feature/jqmAnimationSensor', ['run/config', 'run/ready'], function(runConfig, readyModule) {

    var ready = true,
        startCounter = 0;

    runConfig.appends.unshift(install);

    readyModule.addSensor('jqmAnimationSensor', state);

    return state;

    function install(window) {
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
    }

    function state() {
        return {
            count: startCounter,
            ready: ready
        };
    }
});
uitest.define('run/feature/mobileViewport', ['run/config', 'global'], function(runConfig, global) {
    runConfig.appends.push(install);

    function install(window) {
        var doc = window.document,
            topDoc = global.top.document,
            viewportMeta = findViewportMeta(doc),
            topViewportMeta = findViewportMeta(topDoc),
            newMeta;
        if (topViewportMeta) {
            topViewportMeta.parentNode.removeChild(topViewportMeta);
        }

        if (viewportMeta) {
            newMeta = topDoc.createElement("meta");
            newMeta.setAttribute("name", "viewport");
            newMeta.setAttribute("content", viewportMeta.getAttribute("content"));
            topDoc.getElementsByTagName("head")[0].appendChild(newMeta);
        }
    }

    function findViewportMeta(doc) {
        var metas = doc.getElementsByTagName("meta"),
            meta,
            i;
        for (i=0; i<metas.length; i++) {
            meta = metas[i];
            if (meta.getAttribute('name')==='viewport') {
                return meta;
            }
        }
        return null;
    }
});
uitest.define('run/feature/timeoutSensor', ['run/config', 'run/ready'], function(runConfig, readyModule) {

    var timeouts = {},
        timoutStartCounter = 0;

    runConfig.prepends.unshift(install);
    readyModule.addSensor('timeout', state);
    return state;

    function install(window) {
        var oldTimeout = window.setTimeout;
        window.setTimeout = function (fn, time) {
            var handle;
            var callback = function () {
                delete timeouts[handle];
                if (typeof fn === 'string') {
                    /*jshint evil:true*/
                    window['eval'](fn);
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
    }

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
});

uitest.define('run/feature/xhrSensor', ['run/config', 'run/ready'], function(runConfig, readyModule) {

    var ready = true,
        startCounter = 0;

    runConfig.prepends.unshift(install);

    readyModule.addSensor('xhr', state);
    return state;

    function install(window) {
        var copyStateFields = ['readyState', 'responseText', 'responseXML', 'status', 'statusText'];
        var proxyMethods = ['abort', 'getAllResponseHeaders', 'getResponseHeader', 'open', 'send', 'setRequestHeader'];

        var OldXHR = window.XMLHttpRequest;
        var DONE = 4;
        var newXhr = function() {
                var self = this;
                this.origin = new OldXHR();

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
                        if(name === 'send') {
                            ready = false;
                            startCounter++;
                        } else if(name === 'abort') {
                            ready = true;
                        }
                        // Note: Can't use apply here, as IE7 does not
                        // support apply for XHR methods...
                        var res;
                        if (arguments.length===0) {
                            res = self.origin[name]();
                        } else if (arguments.length===1) {
                            res = self.origin[name](arguments[0]);
                        } else if (arguments.length===2) {
                            res = self.origin[name](arguments[0], arguments[1]);
                        } else if (arguments.length===3) {
                            res = self.origin[name](arguments[0], arguments[1], arguments[2]);
                        } else {
                            throw new Error("Too many arguments for the xhr proxy: "+arguments.length);
                        }
                        copyState();
                        return res;
                    };
                }

                for(var i = 0; i < proxyMethods.length; i++) {
                    proxyMethod(proxyMethods[i]);
                }
                this.origin.onreadystatechange = function() {
                    if(self.origin.readyState === DONE) {
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
    }

    function state() {
        return {
            count: startCounter,
            ready: ready
        };
    }
});
uitest.define('run/historyFix', ['run/htmlInstrumentor', 'run/config'], function(htmlInstrumentor, runConfig) {
    // This needs to be before the normal scriptAdder!
    preprocessHtml.priority = 9999;
    htmlInstrumentor.addPreProcessor(preprocessHtml);

    function preprocessHtml(event, control) {
        var state = event.state,
            token = event.token;

        if (!state.historyFix) {
            state.historyFix = true;
            runConfig.prepends.unshift(fixHistory(state.url));
        }
        control.next();
    }

    function hash(url) {
        var hashPos = url.indexOf('#');
        if (hashPos!==-1) {
            return url.substring(hashPos);
        } else {
            return '';
        }
    }

    function fixHistory(url) {
        // Bugs fixed here:
        // - IE looses the hash when rewriting using a js url
        // - Rewriting using a js url or doc.open/write/close deletes the current history entry.
        //   This yields to problems when using history.back()!
        //   (at least in a fresh Chrome in Inkognito mode)
        // - PhantomJS: creating a history entry using hash change does not work correctly.
        //   Using history.pushState however does work...
        var currHash = hash(url);
        return function(history, location) {
            if (history.pushState) {
                history.pushState(null, "", currHash);
            } else {
                location.hash="someUniqueHashToCreateAHistoryEntry";location.hash=currHash;
            }
        };
    }
});
uitest.define('run/htmlInstrumentor', ['documentUtils', 'run/config', 'run/logger', 'global', 'run/testframe', 'run/sniffer', 'htmlParserFactory'], function(docUtils, runConfig, logger, global, testframe, sniffer, htmlParserFactory) {

    var exports,
        preProcessors = [],
        htmlParser = htmlParserFactory();

    exports = {
        addPreProcessor: addPreProcessor,
        htmlParser: htmlParser,
        processHtml: processHtml
    };
    return exports;

    function processHtml(url, finishedCallback) {
        docUtils.loadFile(url, function(error, html) {
            if (error) {
                finishedCallback(error);
                return;
            }

            htmlParser.transform(html,{
                url: url
            },preProcessors,finishedCallback);
        });
    }

    function addPreProcessor(preProcessor) {
        preProcessors.push(preProcessor);
    }
});
uitest.define('run/injector', ['annotate', 'utils'], function(annotate, utils) {

	var defaultResolvers = [];

	function inject(fn, self, values) {
		var argNames = annotate(fn),
			argValues = [],
			i;
		fn = utils.isArray(fn)?fn[fn.length-1]:fn;
		for (i=0; i<argNames.length; i++) {
			argValues.push(resolveArgIncludingDefaultResolvers(argNames[i], values));
		}
		return fn.apply(self, argValues);
	}

	function resolveArgIncludingDefaultResolvers(argName, resolvers) {
		var resolved = resolveArg(argName, resolvers);
		if (resolved===undefined) {
			resolved = resolveArg(argName, defaultResolvers);
		}
		return resolved;
	}

	function resolveArg(argName, resolvers) {
		var i, resolver, resolved;
		for (i=0; i<resolvers.length && !resolved; i++) {
			resolver = resolvers[i];
			if (utils.isFunction(resolver)) {
				resolved = resolver(argName);
			} else {
				resolved = resolver[argName];
			}
		}
		return resolved;
	}

	function addDefaultResolver(resolver) {
		defaultResolvers.push(resolver);
	}

	return {
		inject: inject,
		addDefaultResolver: addDefaultResolver
	};
});
uitest.define('run/loadSensor', ['run/ready', 'run/config'], function(readyModule, runConfig) {

	var count = 0,
		ready, win, doc, waitForDocComplete;

	init();
	runConfig.appends.push(function(window, document) {
		win = window;
		doc = document;
		waitForDocComplete = true;
	});

	loadSensor.reloaded = reloaded;

	readyModule.addSensor("load", loadSensor);
	return loadSensor;

	function init() {
		ready = false;
		waitForDocComplete = false;
	}

	function loadSensor() {
		if (waitForDocComplete && docReady(doc)) {
			waitForDocComplete = false;
			// this timeout is required for IE, as it sets the
			// readyState to "interactive" before the DOMContentLoaded event.
			win.setTimeout(function() {
				ready = true;
			},1);
		}
		return {
			count: count,
			ready: ready
		};
	}

	function docReady(doc) {
		return doc.readyState==='complete' || doc.readyState==='interactive';
	}

	function reloaded(callback) {
		count++;
		init();
		readyModule.ready(callback);
	}
});

uitest.define('run/logger', ['global', 'run/config'], function(global, runConfig) {

    var lastMsg;
    function log(msg) {
        if (runConfig.trace && lastMsg!==msg) {
            lastMsg = msg;
            global.console.log(msg);
        }
    }

    return {
        log: log
    };
});

uitest.define('run/main', ['documentUtils', 'urlParser', 'global','run/logger', 'run/config', 'run/htmlInstrumentor', 'run/testframe'], function(docUtils, urlParser, global, logger, runConfig, htmlInstrumentor, testframe) {

    start(runConfig.url);
    return;

    // -------

    function start(url) {
        var now = new global.Date().getTime();
        url = urlParser.makeAbsoluteUrl(url, urlParser.uitestUrl());
        url = urlParser.cacheBustingUrl(url, now);
        url = url.replace("{now}",now);
        logger.log("opening url "+url);
        htmlInstrumentor.processHtml(url, function(error, html) {
            if (error) {
                throw error;
            }
            logger.log("rewriting url "+url);
            testframe.load(url, html);
        });
    }

});
uitest.define('run/namedFunctionInstrumentor', ['run/scriptInstrumentor', 'run/injector', 'annotate', 'run/config', 'urlParser', 'run/testframe'], function(scriptInstrumentor, injector, annotate, runConfig, urlParser, testframe) {
    scriptInstrumentor.addPreProcessor(preProcessJavaScript);

    return preProcessJavaScript;

    function preProcessJavaScript(event, control) {
        var token = event.token,
            state = event.state;

        if (token.type!=='functionstart') {
            control.next();
            return;
        }
        var intercept = findMatchingInterceptByName(token.name, state.src);
        if (!intercept) {
            control.next();
            return;
        }
        event.pushToken({
            type: 'other',
            match: 'if (!' + token.name + '.delegate)return ' + testframe.createRemoteCallExpression(fnCallback, "window", token.name, "this", "arguments")
        });
        control.next();
        return;

        function fnCallback(win, fn, self, args) {
            var originalArgNames = annotate(fn),
                originalArgsByName = {},
                $delegate = {
                    fn: fn,
                    name: token.name,
                    self: self,
                    args: args
                },
                i;
            for(i = 0; i < args.length; i++) {
                originalArgsByName[originalArgNames[i]] = args[i];
            }
            fn.delegate = true;
            try {
                return injector.inject(intercept.callback, self, [originalArgsByName,
                {
                    $delegate: $delegate
                },
                win]);
            } finally {
                fn.delegate = false;
            }
        }
    }

    function findMatchingInterceptByName(fnName, scriptUrl) {
        var i,
            intercepts = runConfig.intercepts,
            fileName = urlParser.filenameFor(scriptUrl||'');

        if(intercepts) {
            for(i = 0; i < intercepts.length; i++) {
                if(intercepts[i].fn === fnName && intercepts[i].script === fileName) {
                    return intercepts[i];
                }
            }
        }
    }
});

uitest.define('run/ready', ['run/injector', 'global', 'run/logger'], function(injector, global, logger) {

	var sensorInstances = {};

	function addSensor(name, sensor) {
		sensorInstances[name] = sensor;
	}

	// Goal:
	// - Detect async work started by events that cannot be tracked
	//   (e.g. scroll event, hashchange event, popState event).
	// - Detect the situation where async work starts another async work
	//
	// Algorithm:
	// Wait until all readySensors did not change for 50ms.
	// Note: We already tested with 10ms, but that did not work well
	// for popState events...

	function ready(listener) {
		var sensorStatus;

		function restart() {
			sensorStatus = aggregateSensorStatus(sensorInstances);
			if(sensorStatus.busySensors.length !== 0) {
				logger.log("ready waiting for [" + sensorStatus.busySensors + "]");
				global.setTimeout(restart, 10);
			} else {
				global.setTimeout(ifNoAsyncWorkCallListenerElseRestart, 50);
			}
		}

		function ifNoAsyncWorkCallListenerElseRestart() {
			var currentSensorStatus = aggregateSensorStatus(sensorInstances);
			if(currentSensorStatus.busySensors.length === 0 && currentSensorStatus.count === sensorStatus.count) {
				injector.inject(listener, null, []);
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
		addSensor: addSensor,
		ready: ready
	};
});
uitest.define('run/requirejsInstrumentor', ['run/htmlInstrumentor', 'documentUtils', 'run/injector', 'run/logger', 'utils', 'urlParser', 'run/testframe'], function(docInstrumentor, docUtils, injector, logger, utils, urlParser, testframe) {
    var REQUIRE_JS_RE = /require[\W]/,
        eventHandlers = [];

    // Needs to be executed before the scriptAdder!
    preprocessHtml.priority = 20;
    docInstrumentor.addPreProcessor(preprocessHtml);

    return {
        preprocessHtml: preprocessHtml,
        addEventListener: addEventListener
    };

    function addEventListener(handler) {
        eventHandlers.push(handler);
    }

    function preprocessHtml(event, control) {
        var token = event.token,
            state = event.state;

        if (token.type==='urlscript' && token.src.match(REQUIRE_JS_RE)) {
            handleRequireJsScriptToken();
        }
        control.next();
        return;

        function handleRequireJsScriptToken() {
            logger.log("detected requirejs with script url "+token.src);

            var content = testframe.createRemoteCallExpression(function(win) {
                afterRequireJsScript(win);
            }, "window");

            // needed by the scriptAdder to detect
            // where to append the appends!
            state.requirejs = true;
            event.pushToken({
                type: 'contentscript',
                content: content
            });
        }
    }

    function afterRequireJsScript(win) {
        if(!win.require) {
            throw new Error("requirejs script was detected by url matching, but no global require function found!");
        }

        var _require = patchRequire(win);
        patchLoad(_require);
    }

    function patchRequire(win) {
        var _require = win.require;
        win.require = function(deps, originalCallback) {
            _require.onResourceLoad = win.require.onResourceLoad;
            _require(deps, function() {
                var event = {
                    type: 'require',
                    deps: deps,
                    depsValues:arguments,
                    callback: originalCallback,
                    win:win,
                    require:_require
                };
                utils.processAsyncEvent(event, eventHandlers, defaultHandler, doneHandler);

                function defaultHandler() {
                    event.callback.apply(event.win, event.depsValues);
                }

                function doneHandler(error) {
                    if (error) {
                        throw error;
                    }
                }
            });
        };
        win.require.config = _require.config;
        return _require;
    }

    function patchLoad(_require) {
        var _load = _require.load;
        _require.load = function(context, moduleName, url) {
            var self = this;
            var event = {
                type:'load',
                url: url
            };
            utils.processAsyncEvent(event, eventHandlers, defaultHandler,doneHandler);

            function defaultHandler() {
                _load.call(self, context, moduleName, event.url);
            }

            function doneHandler(error) {
                if (error) {
                    //Set error on module, so it skips timeout checks.
                    context.registry[moduleName].error = true;
                    throw error;
                } else {
                    context.completeLoad(moduleName);
                }
            }
        };
    }

});
uitest.define('run/scriptAdder', ['run/config', 'run/htmlInstrumentor', 'documentUtils', 'run/injector', 'annotate', 'run/logger', 'urlParser', 'utils', 'run/requirejsInstrumentor', 'run/testframe'], function(runConfig, docInstrumentor, docUtils, injector, annotate, logger, urlParser, utils, requirejsInstrumentor, testframe) {
    // This needs to be before the scriptInstrumentor, so
    // the added scripts are also processed!
    preprocessHtml.priority = 10;
    docInstrumentor.addPreProcessor(preprocessHtml);
    requirejsInstrumentor.addEventListener(requirejsEventListener);

    function preprocessHtml(event, control) {
        if (handlePrepends(event, control)) {
            return;
        }
        if (handleAppends(event, control)) {
            return;
        }
        control.next();
    }

    function handlePrepends(event, control) {
        var state = event.state,
            token = event.token;

        if (state.addedPrepends) {
            return;
        }
        if (!runConfig.prepends || !runConfig.prepends.length) {
            return;
        }
        if (token.type !== 'headstart' && token.type !== 'bodystart') {
            return;
        }
        logger.log("adding prepends after "+token.type);
        state.addedPrepends = true;
        createScriptTokensForPrependsOrAppends(event.pushToken, runConfig.prepends);
        control.next();
        return true;
    }

    function handleAppends(event, control) {
        var state = event.state,
            token = event.token;

        if (token.type!=='bodyend') {
            return;
        }
        if (!runConfig.appends || !runConfig.appends.length || state.requirejs) {
            return;
        }
        logger.log("adding appends before "+token.type);
        createScriptTokensForPrependsOrAppends(event.pushToken, runConfig.appends);
        control.next();
        return true;
    }

    function createScriptTokensForPrependsOrAppends(pushToken, prependsOrAppends) {
        var i, prependOrAppend, lastCallbackArr;
        for(i = 0; i < prependsOrAppends.length; i++) {
            prependOrAppend = prependsOrAppends[i];
            if(utils.isString(prependOrAppend)) {
                pushToken({
                    type: 'urlscript',
                    src: prependOrAppend
                });
                lastCallbackArr = null;
            } else {
                if(!lastCallbackArr) {
                    lastCallbackArr = [];
                    pushToken({
                        type: 'contentscript',
                        content: testframe.createRemoteCallExpression(injectedCallbacks(lastCallbackArr), 'window')
                    });
                }
                lastCallbackArr.push(prependOrAppend);
            }
        }
    }

    function injectedCallbacks(callbacks) {
        return function(win) {
            var i;
            for(i = 0; i < callbacks.length; i++) {
                injector.inject(callbacks[i], win, [win]);
            }
        };
    }

    function requirejsEventListener(event, control) {
        if (event.type!=='require') {
            control.next();
            return;
        }
        var i = 0,
            appends = runConfig.appends,
            win = event.win;

        logger.log("adding appends using requirejs");
        execNext();

        function execNext() {
            var append;
            if(i >= appends.length) {
                control.next();
            } else {
                append = appends[i++];
                if(utils.isString(append)) {
                    event.require([append], execNext);
                } else {
                    injector.inject(append, win, [win]);
                    execNext();
                }
            }
        }
    }

    return {
        preprocessHtml: preprocessHtml,
        requirejsEventListener: requirejsEventListener,
        handlePrepends: handlePrepends,
        handleAppends: handleAppends
    };
});
uitest.define('run/scriptInstrumentor', ['run/htmlInstrumentor', 'run/injector', 'documentUtils', 'run/logger', 'run/testframe', 'jsParserFactory', 'run/requirejsInstrumentor', 'urlParser'], function(docInstrumentor, injector, docUtils, logger, testframe, jsParserFactory, requirejsInstrumentor, urlParser) {
    var preProcessors = [],
        jsParser = jsParserFactory();

    docInstrumentor.addPreProcessor(preprocessHtml);
    requirejsInstrumentor.addEventListener(requirejsEventHandler);

    return {
        addPreProcessor: addPreProcessor,
        jsParser: jsParser
    };

    function addPreProcessor(processor) {
        preProcessors.push(processor);
    }

    function preprocessHtml(event, control) {
        var token = event.token,
            state = event.state,
            absUrl;

        if (token.type==='urlscript') {
            absUrl = urlParser.makeAbsoluteUrl(token.src, state.url);
            docUtils.loadScript(absUrl, function(error, scriptContent) {
                if (error) {
                    control.stop(error);
                } else {
                    onScriptLoaded(token.src, token.preAttrs + token.postAttrs, scriptContent);
                }
            });
        } else if (token.type === 'contentscript') {
            onScriptLoaded(null, token.attrs, token.content);
        } else {
            control.next();
        }
        return;

        function onScriptLoaded(scriptSrc, scriptAttrs, scriptContent) {
            jsParser.transform(scriptContent,{
                src: scriptSrc
            },preProcessors,resultCallback);

            function resultCallback(error, newScriptContent) {
                if (error) {
                    control.stop(error);
                    return;
                }
                if (newScriptContent===scriptContent) {
                    control.next();
                    return;
                }
                logger.log("intercepting "+scriptSrc);
                event.pushToken({
                    type: 'contentscript',
                    content: testframe.createRemoteCallExpression(function(win) {
                        docUtils.evalScript(win, newScriptContent);
                    }, "window"),
                    attrs: scriptAttrs
                });
                control.stop();
            }
        }
    }

    function requirejsEventHandler(event, control) {
        if (event.type !== 'load') {
            control.next();
            return;
        }
        var url = event.url,
            docUrl = testframe.win().document.location.href,
            absUrl = urlParser.makeAbsoluteUrl(url, docUrl);

        docUtils.loadScript(absUrl, function(error, scriptContent) {
            if (error) {
                control.stop(error);
            }
            jsParser.transform(scriptContent,{
                src:url
            },preProcessors,resultCallback);

            function resultCallback(error, newScriptContent) {
                if (error) {
                    control.stop(error);
                    return;
                }
                if (newScriptContent===scriptContent) {
                    control.next();
                    return;
                }
                logger.log("intercepting "+url);
                try {
                    docUtils.evalScript(testframe.win(), newScriptContent);
                } catch (e) {
                    error = e;
                }
                control.stop(error);
            }
        });
    }
});

uitest.define('run/testframe', ['urlParser', 'global', 'run/config', 'run/injector', 'run/logger', 'documentUtils', 'run/sniffer'], function(urlParser, global, runConfig, injector, logger, docUtils, sniffer) {
    var WINDOW_ID = 'uitestwindow',
        BUTTON_ID = WINDOW_ID+'Btn',
        BUTTON_LISTENER_ID = BUTTON_ID+"Listener",
        frameElement,
        callbacks = {},
        nextCallbackId = 0;

    injector.addDefaultResolver(function(argName) {
        return getIframeWindow()[argName];
    });

    return {
        win: getIframeWindow,
        load: load,
        createRemoteCallExpression: createRemoteCallExpression
    };

    function getIframeWindow() {
        return frameElement.contentWindow || frameElement.contentDocument;
    }

    function load(url, html) {
        global.uitest.callbacks = callbacks;
        if (sniffer.history) {
            loadUsingHistoryApi(url, html);
        } else {
            loadWithoutHistoryApi(url, html);
        }
    }



    function loadUsingHistoryApi(url, html) {
        var fr, win;
        if (sniffer.browser.ff) {
            // In FF, we can't just juse an empty iframe and rewrite
            // it's content, as then the history api will throw errors
            // whenever history.pushState is used within the frame.
            // We need to do doc.open/write/close in the onload event
            // to prevent this problem!
            createFrame(urlParser.uitestUrl());
            win = getIframeWindow();
            docUtils.addEventListener(win, 'load', afterFrameCreate);
        } else {
            createFrame('');
            win = getIframeWindow();
            // Using doc.open/close empties the iframe, gives it a real url
            // and makes it different compared to about:blank!
            win.document.open();
            win.document.close();

            afterFrameCreate();
        }

        function afterFrameCreate() {
            var win = getIframeWindow();
            win.history.pushState(null, '', url);
            if (false && sniffer.jsUrl) {
                rewriteUsingJsUrl(win,html);
            } else {
                rewriteUsingDocOpen(win, html);
            }
        }
    }

    function loadWithoutHistoryApi(url, html) {
        createFrame(url);
        var win = getIframeWindow();
        docUtils.addEventListener(win, 'load', onload);
        deactivateWindow(win);

        function onload() {
            // Need to use javascript urls here to support xhtml,
            // as we loaded the document into the browser, and in xhtml
            // documents we can't open/write/close the document after this any more!
            rewriteUsingJsUrl(win, html);
        }
    }

    function createFrame(url) {
        var doc = global.document,
            wrapper;
        frameElement = doc.getElementById(WINDOW_ID);
        if (frameElement) {
            frameElement.parentNode.removeChild(frameElement);
            frameElement.src = url;
        } else {
            wrapper = doc.createElement("div");
            wrapper.innerHTML = '<iframe id="'+WINDOW_ID+'" '+
                                'src="'+url+'" '+
                                'width="100%" height="100%" '+
                                'style="position: absolute; top: 0; left: 0; background-color:white; border: 0px;"></iframe>';

            frameElement = wrapper.firstChild;
            frameElement.style.zIndex = 100;
        }
        doc.body.appendChild(frameElement);

        createToggleButtonIfNeeded();

        return frameElement;
    }

    function createToggleButtonIfNeeded() {
        var doc = global.document,
            button = doc.getElementById(BUTTON_ID);

        if (button) {
            // resuse an existing button...
            return button;
        }
        var wrapper = doc.createElement("div");
        wrapper.innerHTML = '<button id="'+BUTTON_ID+'" '+
            'style="position: absolute; z-index: 1000; width: auto; top: 0; right: 0; cursor: pointer;" '+
            'onclick="('+toggleListener.toString()+')(\''+WINDOW_ID+'\');"'+
            '>Toggle testframe</button>';
        button = wrapper.firstChild;
        doc.body.appendChild(button);

        return button;

        function toggleListener(frameId) {
            var el = document.getElementById(frameId);
            el.style.zIndex = el.style.zIndex * -1;
        }
    }

    function rewriteUsingDocOpen(win, html) {
        // If the iframe already has a valid url,
        // wo don't want to change it by this rewrite.
        // By using an inline script this does what we want.
        // Calling win.document.open() directly would give the iframe
        // the url of the current window, i.e. a new url.
        win.newContent = html;
        var sn = win.document.createElement("script");
        sn.setAttribute("id", "rewriteScript");
        sn.setAttribute("type", "text/javascript");
        docUtils.textContent(sn, rewrite.toString()+';rewrite(window, window.newContent);');

        win.document.body.appendChild(sn);

        function rewrite(win, newContent) {
            /*jshint evil:true*/
            win.document.open();
            win.document.write(newContent);
            win.document.close();
        }
    }

    function rewriteUsingJsUrl(win, html) {
        win.newContent = html;
        /*jshint scripturl:true*/
        win.location.href = 'javascript:window.newContent';
    }

    function deactivateWindow(win) {
        win.setTimeout = noop;
        win.clearTimeout = noop;
        win.setInterval = noop;
        win.clearInterval = noop;
        win.XMLHttpRequest = noopXhr;
        if (win.attachEvent) {
            win.attachEvent = noop;
            win.Element.prototype.attachEvent = noop;
            win.HTMLDocument.prototype.attachEvent = noop;
        } else {
            win.addEventListener = noop;
            win.Element.prototype.addEventListener = noop;
            win.HTMLDocument.prototype.addEventListener = noop;
        }

        function noop() { }
        function noopXhr() {
            this.open=noop;
            this.send=noop;
            this.setRequestAttribute=noop;
            this.cancel=noop;
        }
    }

    function createRemoteCallExpression(callback) {
        var argExpressions = global.Array.prototype.slice.call(arguments, 1) || [],
            callbackId = nextCallbackId++;
        callbacks[callbackId] = callback;
        return "parent.uitest.callbacks[" + callbackId + "](" + argExpressions.join(",") + ");";
    }
});

uitest.define('sniffer', ['global', 'documentUtils'], function(global, documentUtils) {

    // This is especially for FF, as it does not revert back
    // to the previous url when using a js url.
    function jsUrlDoesNotChangeLocation(callback) {
        var tmpFrame = global.document.createElement("iframe");
        global.document.body.appendChild(tmpFrame);
        // Opening and closing applies the
        // location href from the parent window to the iframe.
        tmpFrame.contentWindow.document.open();
        tmpFrame.contentWindow.document.close();
        // The timeout is needed as FF triggers the onload
        // from the previous document.open/close
        // even if we set the onload AFTER we did document.open/close!
        global.setTimeout(changeHrefAndAddOnLoad, 0);

        function changeHrefAndAddOnLoad() {
            /*jshint scripturl:true*/
            documentUtils.addEventListener(tmpFrame, "load", onloadCallback);
            tmpFrame.contentWindow.location.href="javascript:'<html><body>Hello</body></html>'";
        }

        function onloadCallback(){
            /*jshint scripturl:true*/
            var result = tmpFrame.contentWindow.location.href.indexOf('javascript:')===-1;
            tmpFrame.parentNode.removeChild(tmpFrame);
            callback(result);
        }
    }

    function browserSniffer() {
        var useragent = global.navigator.userAgent.toLowerCase(),
            android = /android/i.test(useragent),
            ieMatch = /MSIE\s+(\d+)/i.exec(useragent),
            ff = /firefox/i.test(useragent);

        return {
            android: android,
            ie: ieMatch && parseInt(ieMatch[1],10),
            ff: ff
        };
    }


    function detectFeatures(readyCallback) {
        jsUrlDoesNotChangeLocation(function(jsUrlSupported) {
            readyCallback({
                jsUrl: jsUrlSupported,
                browser: browserSniffer(),
                history: !!global.history.pushState
            });
        });
    }

    return detectFeatures;
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
            ids.unshift("sp"+spec.id);
            suite = spec.suite;
        }
        while (suite) {
            ids.unshift("su"+suite.id);
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
        }, "uitest.ready", timeout);
        global.runs(function() {
            facade.current.inject(callback);
        });
    }

    function runsAfterReload(callback, timeout) {
        var ready = false;
        global.runs(function() {
            facade.current.reloaded(function() {
                ready = true;
            });
        });
        global.waitsFor(function() {
            return ready;
        }, "uitest.reloaded", timeout);
        global.runs(function() {
            facade.current.inject(callback);
        });

    }

    return {
        currentIdAccessor: currentIdAccessor,
        runs: runs,
        runsAfterReload: runsAfterReload,
        global: {
            uitest: {
                current: {
                    runs: runs,
                    runsAfterReload: runsAfterReload
                }
            }
        }
    };
});
uitest.define('urlParser', ['global'], function (global) {
    var UI_TEST_RE = /(uitest|simpleRequire)[^\w\/][^\/]*$/,
        NUMBER_RE = /^\d+$/;


    function parseUrl(url) {
        var hashIndex = url.indexOf('#');
        var hash;
        var query = '';
        if (hashIndex !== -1) {
            hash = url.substring(hashIndex + 1);
            url = url.substring(0, hashIndex);
        }
        var queryIndex = url.indexOf('?');
        if (queryIndex !== -1) {
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

    function uitestUrl() {
        var scriptNodes = global.document.getElementsByTagName("script"),
            i, src;
        for(i = 0; i < scriptNodes.length; i++) {
            src = scriptNodes[i].src;
            if(src && src.match(UI_TEST_RE)) {
                return src;
            }
        }
        throw new Error("Could not locate uitest.js in the script tags of the browser");
    }

    function basePath(url) {
        var lastSlash = url.lastIndexOf('/');
        if(lastSlash === -1) {
            return '';
        }
        return url.substring(0, lastSlash);
    }

    function makeAbsoluteUrl(url, baseUrl) {
        if(url.charAt(0) === '/' || url.indexOf('://') !== -1) {
            return url;
        }
        return basePath(baseUrl) + '/' + url;
    }

    function filenameFor(url) {
        var lastSlash = url.lastIndexOf('/');
        var urlWithoutSlash = url;
        if(lastSlash !== -1) {
            urlWithoutSlash = url.substring(lastSlash + 1);
        }
        var query = urlWithoutSlash.indexOf('?');
        if (query !== -1) {
            return urlWithoutSlash.substring(0, query);
        }
        return urlWithoutSlash;
    }

    function cacheBustingUrl(url, timestamp) {
        var parsedUrl = parseUrl(url),
            query = parsedUrl.query,
            i, foundOldEntry = false;
        for (i = 0; i < query.length && !foundOldEntry; i++) {
            if (query[i].match(NUMBER_RE)) {
                query[i] = timestamp;
                foundOldEntry = true;
            }
        }
        if (!foundOldEntry) {
            query.push(timestamp);
        }
        return serializeUrl(parsedUrl);
    }

    return {
        parseUrl:parseUrl,
        serializeUrl:serializeUrl,
        makeAbsoluteUrl: makeAbsoluteUrl,
        filenameFor: filenameFor,
        uitestUrl: uitestUrl,
        cacheBustingUrl: cacheBustingUrl
    };
});
(function() {
    // Note: We only want to call this once,
    // and not on every module instantiation!
    var now = new Date().getTime();

    uitest.define('utils', ['global'], function(global) {
        function isString(obj) {
            return obj && obj.slice;
        }

        function isFunction(value) {
            return typeof value === 'function';
        }

        function isArray(value) {
            return global.Object.prototype.toString.apply(value) === '[object Array]';
        }

        function testRunTimestamp() {
            return now;
        }

        function asyncLoop(items, handler, finalNext, stop) {
            var i = 0,
                steps = [],
                loopRunning = false,
                control = {
                    next: nextStep,
                    stop: stop
                };

            nextStep();

            // We are using the trampoline pattern from lisp here,
            // to prevent long stack calls when the handler
            // is calling control.next in sync!
            function loop() {
                var itemAndIndex;
                if (loopRunning) {
                    return;
                }
                loopRunning = true;
                while (steps.length) {
                    itemAndIndex = steps.shift();
                    handler(itemAndIndex.index, itemAndIndex.item, control);
                }
                loopRunning = false;
            }

            function nextStep() {
                if (i<items.length) {
                    i++;
                    steps.push({
                        item: items[i-1],
                        index: i-1
                    });
                    loop();
                } else {
                    finalNext();
                }
            }
        }

        function processAsyncEvent(event, listeners, finalNext, stop) {
            listeners.sort(compareByPriority);
            asyncLoop(listeners, handler, finalNext, stop);

            function handler(index, listener, control) {
                listener(event, control);
            }
        }

        function compareByPriority(entry1, entry2) {
            return (entry2.priority || 0) - (entry1.priority || 0);
        }

        return {
            isString: isString,
            isFunction: isFunction,
            isArray: isArray,
            testRunTimestamp: testRunTimestamp,
            processAsyncEvent: processAsyncEvent,
            asyncLoop: asyncLoop
        };
    });

})();
(function () {
    uitest.require(["facade", "jasmineSugar"]);
})();
