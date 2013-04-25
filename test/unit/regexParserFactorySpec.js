describe('regexParserFactory', function() {
    var factory, parser, parse, serialize, eventSource;
    beforeEach(function() {
        var modules = uitest.require(["regexParserFactory","eventSourceFactory"]);
        factory = modules.regexParserFactory;
        eventSource = modules.eventSourceFactory();
        parser = factory();
        parse = parser.parse;
        serialize = parser.serialize;
    });

    describe('assertAllCharsInExactOneCapturingGroup', function() {
        function expectOk(input) {
            expect(function() {
                parser.assertAllCharsInExactOneCapturingGroup(input);
            }).not.toThrow();
        }
        function expectError(input) {
            expect(function() {
                parser.assertAllCharsInExactOneCapturingGroup(input);
            }).toThrow();
        }
        it('should allow correct regex', function() {
            expectOk('');
            expectOk('(a)');
            expectOk('(a)?');
            expectOk('(?:(a))');
            expectOk('(a)(?:(b))');
            expectOk('(a(?:b))');
        });
        it('should throw an error for wrong regex', function() {
            expectError('a');
            expectError('a(b)');
            expectError('(a)b');
            expectError('a(b)c');
            expectError('(a)b(c)');
            expectError('(a(b))');
            expectError('(?:a(b))');
        });
    });

    describe('addTokenType', function() {
        it('should throw an error if the regex is invalid', function() {
            expect(function() {
                parser.addTokenType("a", "??", "a", {});
            }).toThrow();
        });
        it('should throw an error if the template does not match the regex', function() {
            expect(function() {
                parser.addTokenType("a", "a", "b", {});
            }).toThrow();
        });
    });

    describe('addSimpleTokenType', function() {
        it('should parse simple tokens', function() {
            var token = 'token';
            parser.addSimpleTokenType(token);
            expect(parse('token')).toEqual([{type:token, match: 'token'}]);
            expect(parse('atoken')).toEqual([{type:'other', match: 'atoken'}]);
            expect(parse('tokena')).toEqual([{type:'other', match: 'tokena'}]);
            expect(parse('a token')).toEqual([{type:'other', match: 'a '}, {type:token, match: 'token'}]);
        });

        it('should serialize new simple tokens', function() {
            parser.addSimpleTokenType('tkn');
            expect(serialize([{type:'tkn'}])).toEqual('tkn');
        });
    });

    describe('parser', function() {
        it('should keep other content during parsing', function() {
            parser.addSimpleTokenType("a");
            parser.addSimpleTokenType("b");
            var input = "only";
            expect(parse(input)).toEqual([{type:'other', match: input}]);
            input = "start.a";
            expect(parse(input)).toEqual([{type:'other', match: "start."},{type:'a', match:"a"}]);
            input = "a.end";
            expect(parse(input)).toEqual([{type:'a', match:"a"},{type:'other', match: ".end"}]);
            input = "a.middle.b";
            expect(parse(input)).toEqual([{type:'a', match:"a"},{type:'other', match: ".middle."},{type:'b', match:"b"}]);
        });
        it('should be case insensitive', function() {
            parser.addSimpleTokenType('a');
            expect(parser.parse("A")).toEqual([ { match : 'A', type : 'a' }]);
        });
        it('should parse token types with named groups', function() {
            parser.addTokenType("t", "(\\[\\s*)(.*?)(\\s*\\])", "[]", {1:"content"});
            expect(parser.parse("[a]")).toEqual([{type: "t", content: "a", match: "[a]"}]);
            expect(parser.parse("[ a ]")).toEqual([{type: "t", content: "a", match: "[ a ]"}]);
            expect(parser.parse("[a][b]")).toEqual([{type: "t", content: "a", match: "[a]"},{type: "t", content: "b", match: "[b]"}]);
        });
        it('should parse token types without named groups', function() {
            parser.addTokenType("t", "(\\[\\s*.*?\\s*\\])", "[]", {});
            expect(parser.parse("[a]")).toEqual([{type: "t", match: "[a]"}]);
            expect(parser.parse("[a][b]")).toEqual([{type: "t", match: "[a]"},{type: "t", match: "[b]"}]);
        });
        it('should parse multiple tokens', function() {
            parser.addSimpleTokenType('a');
            parser.addSimpleTokenType('b');
            expect(parser.parse("a.b")).toEqual([ { match : 'a', type : 'a' }, { type : 'other', match : '.' }, { match : 'b', type : 'b' } ]);
        });
    });

    describe('serialize', function() {
        it('should serialize other content', function() {
            expect(serialize([{type:'other', match:'otherToken'}])).toBe('otherToken');
        });
        it('should serialize token types with named groups', function() {
            parser.addTokenType("t", "(\\[\\s*)(.*?)(\\s*\\])", "[]", {1:"content"});
            expect(parser.serialize([{type:"t", content: "b", match:"[ a ]"}])).toBe('[ b ]');
            expect(parser.serialize([{type:"t", content: "b"}])).toBe('[b]');
        });
        it('should serialize token types without named groups', function() {
            parser.addTokenType("t", "(\\[.*?\\])", "[]", {});
            expect(parser.serialize([{type:"t", match:"[ a ]"}])).toBe('[ a ]');
            expect(parser.serialize([{type:"t"}])).toBe('[]');
        });
        it('should serialize multiple token types', function() {
            parser.addSimpleTokenType('a');
            parser.addSimpleTokenType('b');
            expect(serialize([{type:'a'},{type:'other',match:'.'},{type:'b'}])).toEqual('a.b');
        });
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