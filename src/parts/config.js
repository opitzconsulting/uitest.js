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