TODO
----
Next:
- jasmine syntactic sugar
  - integration tests with special jasmine syntax
- better iframe css -> 
  body: { margin-bottom: screen-height }
- test on different browsers!!
- If all runs: requirejs support!
- Delete old sources and tests.
- Update build system to grunt.js, without ejs templates!
- Check Readme.md...

* logger.log: Sollte man konfigurieren können
  (per default kein logging)  
  - Und: noch mehr loggen?
  
* Fehler im iframe/popup als Fehler weiterreichen
  - wie? Evtl. beim nächsten Aufruf von inject, ...  

Jasmine-Support:
- uitest.current:
  * No function, but a delegate that always delegates
    to the uitest instance for the current test!
- global: runs
  * Integrate inject
  * Should also work in the outermost callback of an "it", e.g.
    it("should...", function(someGlobal) {

    });
- global: waitsForReady
  * Use a readyLatch for this.
    -> Remove readyLatch from general code!

==> Ziel: API sollte minimal und so einfach wie möglich sein!

Add to Readme:
Supporting libs:
- simulating user events:
    http://qunitjs.com/cookbook/#testing_user_actions](http://qunitjs.com/cookbook/#testing_user_actions)  
- xhr mock: https://github.com/philikon/MockHttpRequest/blob/master/lib/mock.js
  * Usage: add as "prepends", then another prepends with a callback to initialize it.
- angularjs $httpBackend mock: 
  * add angular-mocks.js as "append" and a function that initializes it.
