uitest.define('config', [], function() {
	var exports,
		LOAD_MODE_IFRAME = "iframe",
        LOAD_MODE_POPUP = "popup";

	function create() {
		if (this === exports) {
			return new create();
		}
		this._data = {
			loadMode: LOAD_MODE_IFRAME
		};
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
				return setter.apply(this, arguments);
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
			if (!this._data[name]) this._data[name] = [];
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
		target = target || {};
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

	exports = {
		create: create
	};
	return exports;
});