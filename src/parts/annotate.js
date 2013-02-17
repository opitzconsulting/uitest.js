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