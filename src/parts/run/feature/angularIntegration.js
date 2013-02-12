uitest.define("run/feature/angularIntegration", ["run/injector", "run/config"], function(injector, runConfig) {
    runConfig.appends.push(install);

    function install(angular) {
        if (!angular) throw new Error("Angular is not loaded!");

        var ng = angular.module("ng");
        ng.config(function($provide){
            if (angular.mock) {
                // disable auto-flushing by removing the $browser argument,
                // so we can control flushing using $httpBackend.flush()!
                angular.mock.e2e.$httpBackendDecorator.splice(1,1);
                // enable the mock backend
                $provide.decorator('$httpBackend', angular.mock.e2e.$httpBackendDecorator);
            }
        });

        ng.run(function($injector) {
            injector.addDefaultResolver(angularResolver);
            
            function angularResolver(argName) {
                try {
                    return $injector.get(argName);
                } catch (e) {
                    return undefined;
                }
            }
        });
    }
});