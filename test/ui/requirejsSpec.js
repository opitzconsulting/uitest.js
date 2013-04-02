describe('requirejs', function() {
    var uit = uitest.current;

    describe('without data-main', function() {
        uit.url("../test/ui/fixtures/requirejs.html");
        createSpecs();
    });

    describe('with data-main', function() {
        uit.url("../test/ui/fixtures/requirejsDataMain.html");
        createSpecs();
    });

    function createSpecs() {
        describe('onResourceLoad', function() {
            it('should still call onResourceLoad callback', function() {
                uit.runs(function(resources) {
                    expect(resources[resources.length-1]).toEqual('sayHello');
                });
            });
        });

        describe('append', function() {
            it('should exec append functions before the require callback', function() {
                var savedExecState;
                uit.append(function(execState) {
                    savedExecState = {
                        state: execState
                    };
                });
                uit.runs(function(execState) {
                    expect(savedExecState.state).toBe("end");
                    expect(execState).toBe("loaded");
                });
            });
            it('should load append scripts before the require callback', function() {
                uit.append("saveExecState.js");
                uit.runs(function(savedExecState, execState) {
                    expect(savedExecState.state).toBe("end");
                    expect(execState).toBe("loaded");
                });
            });
        });

        describe('intercept', function() {
            it('should intercept private functions by name', function() {
                var savedData = {};
                uit.intercept({
                    script: "sayHello.js",
                    fn: "sayHello",
                    callback: function(userName, execState, $delegate) {
                        savedData.execState = execState;
                        savedData.$delegate = $delegate;
                        return "intercepted " + userName;
                    }
                });
                uit.runs(function(testIntercept) {
                    expect(testIntercept("someUser")).toBe("intercepted someUser");
                });
            });
        });

        describe('cacheBusting', function() {
            function findHelloScriptUrl(doc) {
                var i,
                    scripts = doc.getElementsByTagName("script");

                for (i=0; i<scripts.length; i++) {
                    if (scripts[i].src.indexOf('sayHello')!==-1) {
                        return scripts[i].src;
                    }
                }
                return undefined;
            }
            it('should do nothing if disabled', function() {
                uit.runs(function(document) {
                    var helloJsUrl = findHelloScriptUrl(document);
                    expect(helloJsUrl).toMatch(/sayHello\.js/);
                });
            });
            it('should work if enabled', function() {
                uit.feature('cacheBuster');
                uit.runs(function(document) {
                    var helloJsUrl = findHelloScriptUrl(document);
                    expect(helloJsUrl).toMatch(/sayHello\.js\?[0-9]+/);
                });
            });
        });

    }
});