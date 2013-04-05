describe('top', function() {
    var top, global;
    beforeEach(function() {
        global = {
            top: {
                document: {
                    getElementsByTagName: jasmine.createSpy('getElementsByTagName')
                }
            }
        };
    });
    function createTop() {
        top = uitest.require({
            global: global
        }, ["top"]).top;
    }
    it('should return global if top is not accessible', function() {
        global.top.document.getElementsByTagName.andThrow(new Error());
        createTop();
        expect(top).toBe(global);
    });
    it('should return global if top does not contain a body element', function() {
        global.top.document.getElementsByTagName.andReturn([]);
        createTop();
        expect(top).toBe(global);
    });
    it('should return global.top if top is accessible', function() {
        global.top.document.getElementsByTagName.andReturn([{}]);
        createTop();
        expect(top).toBe(global.top);
    });
});
