describe('run/scriptAdder', function() {
    var config, eventSource;
    beforeEach(function() {
        config = {
            appends: ['configAppend1'],
            prepends: ['configPrepend1']
        };
        var modules = uitest.require({
            "run/config": config
        }, ["run/scriptAdder", "run/eventSource"]);
        eventSource = modules["run/eventSource"];
    });

    it('adds the run/config appends to the addAppends event after all other handlers', function() {
        var event = {
                type: 'addAppends',
                handlers: []
            };
        eventSource.on('addAppends', addAppends);
        eventSource.emit(event);
        expect(event.handlers).toEqual(['otherHandler','configAppend1']);

        function addAppends(event, done) {
            event.handlers.push('otherHandler');
            done();
        }
    });
    it('adds the run/config prepends to the addPrepends event after all other handlers', function() {
        var event = {
                type: 'addPrepends',
                handlers: []
            };
        eventSource.on('addPrepends', addPrepends);
        eventSource.emit(event);
        expect(event.handlers).toEqual(['otherHandler','configPrepend1']);

        function addPrepends(event, done) {
            event.handlers.push('otherHandler');
            done();
        }
    });
});