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