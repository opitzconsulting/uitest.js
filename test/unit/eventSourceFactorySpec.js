describe('eventSourceFactory', function() {
    var eventSource, listener,
    emitDone, someEvent;
    beforeEach(function() {
        eventSource = uitest.require(["eventSourceFactory"])["eventSourceFactory"]();
        listener = jasmine.createSpy('listener');
        emitDone = jasmine.createSpy('emitDone');
        someEvent = {
            type: 'someEvent'
        };
    });
    it('allows to register listeners', function() {
        eventSource.on('someEvent', listener);
    });
    it('triggers the listener with the given event object', function() {
        eventSource.on('someEvent', listener);
        eventSource.emit(someEvent);
        expect(listener.mostRecentCall.args[0]).toBe(someEvent);
        delete someEvent.type;
        expect(function() {
            eventSource.emit(someEvent);
        }).toThrow();
    });
    it('triggers the listener with the given event name', function() {
        eventSource.on('someEvent', listener);
        eventSource.emit('someEvent');
        var event = listener.mostRecentCall.args[0];
        expect(event).toBeTruthy();
        expect(event.type).toBe('someEvent');
    });
    it('triggers a listener only for the events it has been registered', function() {
        var someEvent2 = {
            type: 'someEvent2'
        };
        eventSource.on('someEvent', listener);
        eventSource.emit(someEvent);
        eventSource.emit(someEvent2);
        expect(listener.callCount).toBe(1);
        expect(listener.mostRecentCall.args[0]).toBe(someEvent);
    });
    it('triggers listeners registered for "*" for any event', function() {
        eventSource.on('*', listener);
        eventSource.emit(someEvent);
        expect(listener).toHaveBeenCalled();
    });
    it('does not throw an error if no listeners are registered', function() {
        eventSource.emit(someEvent);
    });
    it('triggers the event listeners asynchronously giving them a finished callback', function() {
        var listener2 = jasmine.createSpy('listener2');
        eventSource.on('someEvent', listener);
        eventSource.on('someEvent', listener2);
        eventSource.emit(someEvent, emitDone);
        expect(listener).toHaveBeenCalled();
        expect(listener2).not.toHaveBeenCalled();
        expect(emitDone).not.toHaveBeenCalled();
        listener.mostRecentCall.args[1]();
        expect(listener2).toHaveBeenCalled();
        expect(emitDone).not.toHaveBeenCalled();
        listener2.mostRecentCall.args[1]();
        expect(emitDone).toHaveBeenCalledWith(undefined, someEvent);
    });
    it('stops the event execution when event.stop is called', function() {
        var listener2 = jasmine.createSpy('listener2');
        eventSource.on('someEvent', listener);
        eventSource.on('someEvent', listener2);
        eventSource.emit(someEvent, emitDone);
        expect(emitDone).not.toHaveBeenCalled();
        listener.mostRecentCall.args[0].stop();
        expect(emitDone).not.toHaveBeenCalled();
        listener.mostRecentCall.args[1]();
        expect(emitDone).toHaveBeenCalled();
        expect(someEvent.stopped).toBe(true);
        expect(listener2).not.toHaveBeenCalled();
    });
    it('returns an error from the listeners', function() {
        var someError = {};
        eventSource.on('someEvent', listener);
        eventSource.emit(someEvent, emitDone);
        expect(emitDone).not.toHaveBeenCalled();
        listener.mostRecentCall.args[1](someError);
        expect(emitDone).toHaveBeenCalledWith(someError, someEvent);
    });
    it('returns the event', function() {
        eventSource.on('someEvent', listener);
        eventSource.emit(someEvent, emitDone);
        expect(emitDone).not.toHaveBeenCalled();
        listener.mostRecentCall.args[1]();
        expect(emitDone).toHaveBeenCalledWith(undefined, someEvent);
    });
    it('orders the listeners by their priority', function() {
        var listener2 = jasmine.createSpy('listener2');
        listener2.priority = 100;
        eventSource.on('someEvent', listener);
        eventSource.on('someEvent', listener2);
        eventSource.emit(someEvent, emitDone);
        expect(listener2).toHaveBeenCalled();
        expect(listener).not.toHaveBeenCalled();
    });
});