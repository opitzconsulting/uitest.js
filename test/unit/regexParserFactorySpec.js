describe('regexParserFactory', function() {
    var factory, parser, parse, serialize;
    beforeEach(function() {
        factory = uitest.require(["regexParserFactory"]).regexParserFactory;
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
            }).toThrow(new Error("Invalid regular expression: /^??$/: Nothing to repeat"));
        });
        it('should throw an error if the template does not match the regex', function() {
            expect(function() {
                parser.addTokenType("a", "a", "b", {});
            }).toThrow(new Error("Template 'b' does not match the regex 'a'"));
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
            parser.transform('a',{},[],resultCb);
            expect(result).toBe('a');
            expect(error).toBe(null);
        });
        it('should pass the parsed tokens to the listeners', function() {
            var processedTokens = [];
            function listener(event, control) {
                processedTokens.push(event.token);
                control.next();
            }
            parser.transform('a.b',null,[listener],resultCb);
            expect(processedTokens).toEqual([{type:'a',match:'a'},{type:'other',match:'.'},{type:'b',match:'b'}]);
        });
        it('should remove stopped tokens', function() {
            function listener(event, control) {
                if (event.token.type==='other') {
                    control.stop();
                } else {
                    control.next();
                }
            }
            parser.transform('a.b',null,[listener],resultCb);
            expect(result).toBe('ab');
            expect(error).toBe(null);
        });
        it('should add input tokens using event.pushToken', function() {
            var processedTokens = [];
            function listener(event, control) {
                processedTokens.push(event.token);
                if (event.token.match==='a') {
                    event.pushToken({
                        type: 'other',
                        match: '.'
                    });
                }
                control.next();
            }
            parser.transform('a',null,[listener],resultCb);
            expect(result).toBe('a.');
            expect(error).toBe(null);
            expect(processedTokens).toEqual([{type:'a',match:'a'},{type:'other', match:'.'}]);
        });
        it('should collect errors', function() {
            function listener(event, control) {
                if (event.token.type==='other') {
                    control.stop('some Error');
                } else {
                    control.next();
                }
            }
            parser.transform('a.b',null,[listener],resultCb);
            expect(result).toBe('ab');
            expect(error).toEqual(['some Error']);
        });

        it('should process the tokens asynchronously', function() {
            var control;
            function listener(event, _control) {
                control = _control;
            }
            parser.transform('a',null,[listener],resultCb);
            expect(resultCb).not.toHaveBeenCalled();
            control.next();
            expect(resultCb).toHaveBeenCalledWith(null, 'a');
        });

        it('should share the state for all tokens and all listeners', function() {
            var state = {},
                states = [],
                i;
            function listener1(event, control) {
                states.push(event.state);
                control.next();
            }
            function listener2(event, control) {
                states.push(event.state);
                control.next();
            }
            parser.transform('a.b', state, [listener1, listener2], resultCb);
            for (i=0; i<states.length; i++) {
                expect(states[i]).toBe(state);
            }
        });
    });

});