// These tests and the implementation were copied form https://github.com/angular
describe('annotate', function() {
    var annotate;
    beforeEach(function() {
        annotate = uitest.require(["annotate"]).annotate;
    });
    it('should return $inject', function() {
        function fn() {}
        fn.$inject = ['a'];
        expect(annotate(fn)).toBe(fn.$inject);
        expect(annotate(function() {})).toEqual([]);
        expect(annotate(function() {})).toEqual([]);
        expect(annotate(function() {})).toEqual([]);
        expect(annotate(function /* */ () {})).toEqual([]);
    });


    it('should create $inject', function() {
      /*global extraParans:true */
      // keep the multi-line to make sure we can handle it
      function $f_n0 /*
          */(
          $a, // x, <-- looks like an arg but it is a comment
          b_ , /* z, <-- looks like an arg but it is a
                 multi-line comment
                 function (a, b) {}
                 */
          _c,
          /* {some type} */ d) { extraParans();}
      expect(annotate($f_n0)).toEqual(['$a', 'b_', '_c',  'd']);
      expect($f_n0.$inject).toEqual(['$a', 'b_', '_c',  'd']);
    });


    it('should strip leading and trailing underscores from arg name during inference', function() {
      function beforeEachFn(_foo_) { /* foo = _foo_ */ }
      expect(annotate(beforeEachFn)).toEqual(['foo']);
    });


    it('should handle no arg functions', function() {
      function $f_n0() {}
      expect(annotate($f_n0)).toEqual([]);
      expect($f_n0.$inject).toEqual([]);
    });


    it('should handle no arg functions with spaces in the arguments list', function() {
      function fn( ) {}
      expect(annotate(fn)).toEqual([]);
      expect(fn.$inject).toEqual([]);
    });


    it('should handle args with both $ and _', function() {
      function $f_n0($a_) {}
      expect(annotate($f_n0)).toEqual(['$a_']);
      expect($f_n0.$inject).toEqual(['$a_']);
    });


    it('should throw on non function arg', function() {
      expect(function() {
        annotate({});
      }).toThrow();
    });
});
