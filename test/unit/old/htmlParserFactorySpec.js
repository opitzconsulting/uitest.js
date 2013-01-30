jasmineui.require(["htmlParserFactory"], function (htmlParserFactory) {

    describe("htmlparser", function () {
        var htmlparser;
        beforeEach(function() {
            // htmlparser is used via eval statement in instrumentor.js, so we do the same in the test
            // to be sure all dependencies are included!
            htmlparser = eval("("+htmlParserFactory+")()");
        });
        describe('replaceScripts', function() {
            var callback;
            beforeEach(function() {
                callback = jasmine.createSpy('callback');
            });
            it('should replace inline scripts', function() {
                var someReplacement = 'someReplacement';
                callback.andReturn(someReplacement);
                var result = htmlparser.replaceScripts('<script>a</script>',callback);
                expect(callback.callCount).toBe(1);
                expect(callback).toHaveBeenCalledWith(undefined, 'a');
            });
            it('should replace scripts if the result is not undefined', function() {
                var someReplacement = 'someReplacement';
                callback.andReturn(someReplacement);
                expect(htmlparser.replaceScripts('<script>a</script>',callback)).toBe(someReplacement);
            });
            it('should not replace scripts if the result is undefined', function() {
                var input = '<script>a</script>';
                expect(htmlparser.replaceScripts(input, callback)).toBe(input);
            });
            it('should replace multiple inline scripts', function () {
                htmlparser.replaceScripts('<script>a</script><script>b</script>', callback);
                expect(callback.callCount).toBe(2);
                expect(callback.argsForCall[0]).toEqual([undefined, 'a']);
                expect(callback.argsForCall[1]).toEqual([undefined, 'b']);
            });
            it('should replace multi line inline scripts', function () {
                var content = 'a\r\nb';
                htmlparser.replaceScripts('<script>'+content+'</script>', callback);
                expect(callback).toHaveBeenCalledWith(undefined, content);
            });
        });

        describe('convertScriptContentToEvalString', function() {
            function checkConversion(input, output) {
                expect(eval(htmlparser.convertScriptContentToEvalString(input))).toBe(output);
            }

            it('should handle normal content', function() {
                checkConversion('someContent', 'someContent');
            });
            it('should handle content with \\n', function() {
                checkConversion('someCon\ntent', 'someContent');
            });
            it('should handle content with \\r', function() {
                checkConversion('someCon\rtent', 'someContent');
            });
        });

        describe('addAttributeToHtmlTag', function() {
            it('should add the attribute', function() {
                expect(htmlparser.addAttributeToHtmlTag('<html></html>', 'someAttr')).toBe('<html someAttr></html>');
            });
            it('should be able to handle ie8 special tags', function() {
                var input = '<!--[if IEMobile 7 ]>\
                    <html class="no-js iem7" lang="en"> <![endif]-->\
                        <!--[if (gt IEMobile 7)|!(IEMobile)]><!-->\
                            <html class="no-js" lang="en"> <!--<![endif]-->';
                var output = '<!--[if IEMobile 7 ]>\
                    <html someAttr class="no-js iem7" lang="en"> <![endif]-->\
                        <!--[if (gt IEMobile 7)|!(IEMobile)]><!-->\
                            <html someAttr class="no-js" lang="en"> <!--<![endif]-->';
                expect(htmlparser.addAttributeToHtmlTag(input, 'someAttr')).toBe(output);
            });
        });

    });
});
