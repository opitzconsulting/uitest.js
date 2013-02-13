uitest.define('run/injector', ['annotate'], function(annotate) {

	var defaultResolvers = [];

	function inject(fn, self, values) {
		var argNames = annotate(fn),
			argValues = [],
			i;
		fn = isArray(fn)?fn[fn.length-1]:fn;
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
			if (isFunction(resolver)) {
				resolved = resolver(argName);
			} else {
				resolved = resolver[argName];
			}
		}
		return resolved;
	}

    function isFunction(value) {
        return typeof value === 'function';
    }

	function isArray(value) {
		/*global toString:true*/
		return toString.apply(value) === '[object Array]';
	}

	function addDefaultResolver(resolver) {
		defaultResolvers.push(resolver);
	}

	return {
		inject: inject,
		addDefaultResolver: addDefaultResolver
	};
});