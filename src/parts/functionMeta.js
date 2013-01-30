uitest.define('functionMeta', [], function() {

	function fnName(fn) {
		if(!fn) {
			return '';
		}
		if(fn.name) {
			return fn.name;
		}
		// Note: Some browser do not support Function.name property.
		// By this, we also need to parse the function as a string.
		var FN_NAME_RE = /function\s*(\w+)/;
		var string = fn.toString();
		var match = string.match(FN_NAME_RE);
		if(match) {
			return match.group(1);
		}
		return '';
	}

	return {
		fnName: fnName
	};
});