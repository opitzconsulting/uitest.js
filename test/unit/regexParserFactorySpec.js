xdescribe('regexParserFactory', function() {
    var factory, parser, parse, serialize, eventSource;
    beforeEach(function() {
        var modules = uitest.require(["regexParserFactory","eventSourceFactory"]);
        factory = modules.regexParserFactory;
        eventSource = modules.eventSourceFactory();
        parser = factory();
        parse = parser.parse;
        serialize = parser.serialize;
    });

    describe('transform', function() {
        var result, error, resultCb;
        beforeEach(function() {
            parser.addSimpleTokenType('a');
            parser.addSimpleTokenType('b');
            resultCb = jasmine.createSpy('result').andCallFake(function(_error, _result) {
                error = _error;
                result = _result;
            });
            result = null;
        });
        it('should return the input string if no listeners are given', function() {
            parser.transform({input: 'a', eventSource: eventSource},resultCb);
            expect(result).toBe('a');
            expect(error).toBeFalsy();
        });
        it('should use the given prefix for events', function() {
            var listener = jasmine.createSpy('listener');
            eventSource.on('*', listener);
            parser.transform({
                input: 'a',
                eventSource: eventSource,
                eventPrefix: 'html:'
            },resultCb);
            expect(listener.mostRecentCall.args[0].type).toBe('html:a');
        });
        it('should pass the parsed tokens to the listeners', function() {
            var processedTokens = [];
            function listener(event, done) {
                processedTokens.push(event.token);
                done();
            }
            eventSource.on('*', listener);
            parser.transform({input: 'a.b',eventSource:eventSource},resultCb);
            expect(processedTokens).toEqual([{type:'a',match:'a'},{type:'other',match:'.'},{type:'b',match:'b'}]);
        });
        it('should remove stopped tokens', function() {
            function listener(event, done) {
                if (event.token.type==='other') {
                    event.stop();
                }
                done();
            }
            eventSource.on('*', listener);
            parser.transform({input: 'a.b',eventSource:eventSource},resultCb);
            expect(result).toBe('ab');
            expect(error).toBeFalsy();
        });
        it('should add multiple input tokens using event.pushToken', function() {
            var processedTokens = [];
            function listener(event, done) {
                processedTokens.push(event.token);
                if (event.token.match==='a') {
                    event.pushToken({
                        type: 'other',
                        match: '.'
                    });
                    event.pushToken({
                        type: 'other',
                        match: ','
                    });
                }
                done();
            }
            eventSource.on('*', listener);
            parser.transform({input:'a',eventSource:eventSource},resultCb);
            expect(result).toBe('a.,');
            expect(error).toBeFalsy();
            expect(processedTokens).toEqual([{type:'a',match:'a'},{type:'other', match:'.'},{type:'other', match:','}]);
        });
        it('should stop at and return errors', function() {
            var tokens = [];
            function listener(event, done) {
                tokens.push(event.token);
                if (event.token.type==='other') {
                    done('some Error');
                } else {
                    done();
                }
            }
            eventSource.on('*', listener);
            parser.transform({input: 'a.b',eventSource:eventSource},resultCb);
            expect(tokens.length).toBe(2);
            expect(error).toEqual('some Error');
        });

        it('should process the tokens asynchronously', function() {
            var listenerDone;
            function listener(event, _done) {
                listenerDone = _done;
            }
            eventSource.on('*', listener);
            parser.transform({input: 'a',eventSource:eventSource},resultCb);
            expect(resultCb).not.toHaveBeenCalled();
            listenerDone();
            expect(resultCb).toHaveBeenCalledWith(undefined, 'a');
        });

        it('should share the state for all tokens and all listeners', function() {
            var state = {},
                states = [],
                i;
            function listener1(event, done) {
                states.push(event.state);
                done();
            }
            function listener2(event, done) {
                states.push(event.state);
                done();
            }
            eventSource.on('*', listener1);
            eventSource.on('*', listener2);
            parser.transform({input:'a.b', state:state, eventSource:eventSource}, resultCb);
            for (i=0; i<states.length; i++) {
                expect(states[i]).toBe(state);
            }
        });
    });

});