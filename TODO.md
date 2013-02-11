TODO
----
Für Demo für Nils und SSC:
- Rylc-Tests komplett umstellen
  ==> auch testutils
- Dann sieht man alle Features
  * leichte Syntax
  * intercept
  * uitest.current.runs mit Dep. Injection.
  * ...  

- Migration Guide for jasmine-ui
  + Decision why to drop jasmine-ui:
    * too complicated
    * too complex to integrate other test languages
    * older browser support
    * idea of dependency injection in callbacks simplified things a lot!
    * browsers are now able to debug accross iframes!

tests and cleanup:
- test on different browsers!!
  * Safari, Chrome, FF: OK!
  * IE?
- Samples
  * include xhr mock
  * include angular-mocks in angular
  * include simulate

Later
---------
- syntactic sugar for other testfkws:
  * Mocha
  * QUnit

* Performance if the browser-tab is in the background:
  - In chrome, executing ui tests via testacular is slow if
    the browser-tab is in the background (i.e. another tab is open and focused).

* Better error handling:
  - error event listener for general errors in iframes/popups
  - how to report? On the next call to ready/inject/...?

- Update build system to grunt.js, without ejs templates!
