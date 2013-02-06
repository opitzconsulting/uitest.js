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