jasmineui.require(['factory!persistentData'], function (persistentDataFactory) {
    describe('persistentData', function () {
        var pd, globals, instrumentor;

        function init(_globals) {
            globals = _globals;
            instrumentor = {
                loaderScript: jasmine.createSpy('loaderScript')
            };
            pd = persistentDataFactory({
                globals:globals,
                instrumentor: instrumentor
            });
        }

        describe('non popup mode', function () {
            beforeEach(function() {
                init({
                    sessionStorage:{}
                });
            });

            it('should load the data from sessionStorage.jasmineui_data and delete it afterwards', function () {
                var someData = {a:'b'};
                globals.sessionStorage.jasmineui_data = JSON.stringify(someData);
                expect(pd()).toEqual(someData);
                expect(globals.sessionStorage.jasmineui_data).toBeUndefined();
            });

            it('should load the data into jasmineui.persistent', function() {
                var someData = {a:'b'};
                globals.sessionStorage.jasmineui_data = JSON.stringify(someData);
                expect(pd()).toBe(globals.jasmineui.persistent);
            });

            it('should save the data to sessionStorage.jasmineui_data', function() {
                var data = pd();
                data.a = 'b';
                pd.saveDataToWindow(globals);
                expect(globals.sessionStorage.jasmineui_data).toBe(JSON.stringify(data));
            });

            it('should save the data to sessionStorage.jasmineui_data also in other windows using eval', function() {
                var data = pd();
                data.a = 'b';
                var newWindow = {
                    sessionStorage: {},
                    eval: jasmine.createSpy('eval')
                };
                pd.saveDataToWindow(newWindow);
                expect(newWindow.eval).toHaveBeenCalledWith('sessionStorage.jasmineui = window.tmp;');
            });

            it('should save the loaderScript from the instrumentor into sessionStorage.jasmineui', function() {
                var someScript = 'someScript';
                instrumentor.loaderScript.andReturn('someScript');
                pd.saveDataToWindow(globals);
                expect(globals.sessionStorage.jasmineui).toBe(someScript);
            });

        });

        describe('popup mode', function() {
            var opener;
            beforeEach(function() {
                opener = {
                    jasmineui: {
                        persistent: {
                            a: 'b'
                        }
                    }
                };
                init({
                    sessionStorage:{},
                    opener: opener
                });
            });
            it('should return the persistent data of the owner window', function() {
                expect(pd()).toBe(opener.jasmineui.persistent);
            });
            it('should only save the loaderScript into a new window', function() {
                var someScript = 'someScript';
                instrumentor.loaderScript.andReturn(someScript);
                pd.saveDataToWindow(globals);
                expect(globals.sessionStorage.jasmineui).toBe(someScript);
                expect(globals.sessionStorage.jasmineui_data).toBeUndefined();
            });
        });

        describe('iframe mode', function() {
            var parent;
            beforeEach(function() {
                parent = {
                    jasmineui: {
                        persistent: {
                            a: 'b'
                        }
                    }
                };
                init({
                    sessionStorage:{},
                    parent: parent
                });
            });
            it('should return the persistent data of the owner window', function() {
                expect(pd()).toBe(parent.jasmineui.persistent);
            });
            it('should only save the loaderScript into a new window', function() {
                var someScript = 'someScript';
                instrumentor.loaderScript.andReturn(someScript);
                pd.saveDataToWindow(globals);
                expect(globals.sessionStorage.jasmineui).toBe(someScript);
                expect(globals.sessionStorage.jasmineui_data).toBeUndefined();
            });
        });

    });
});
