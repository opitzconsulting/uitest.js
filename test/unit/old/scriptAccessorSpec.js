jasmineui.require(['factory!scriptAccessor'], function (scriptAccessorFactory) {
    describe('scriptAccessor', function () {
        var scriptAccessor, document;
        beforeEach(function () {
            document = {
                getElementsByTagName:jasmine.createSpy('getElementsByTagName')
            };
            scriptAccessor = scriptAccessorFactory({
                globals:{
                    document:document
                }
            });
        });
        it("should use the last script node in the document", function () {
            var scripts = [
                {src:'source1'},
                {src:'source2'}
            ];
            document.getElementsByTagName.andReturn(scripts);
            expect(scriptAccessor.currentScriptUrl()).toBe('source2');
        });
        it("should create a data url for inline scripts", function () {
            var scripts = [
                {textContent:'someContent'}
            ];
            document.getElementsByTagName.andReturn(scripts);
            expect(scriptAccessor.currentScriptUrl()).toBe('data:text/javascript;charset=utf-8,someContent');
        });
    });
});
