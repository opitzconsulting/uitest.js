TODO
----
features:
- requirejs support:
  * basic support ok, ui tests are ok, unit tests are missing.
- syntactic sugar for other testfkws:
  * Mocha
  * QUnit

* logger.log: Sollte man konfigurieren können
  (per default kein logging)  
  - Und: noch mehr loggen?
  - Idee: in config ein logLevel angeben  
  - Problem: es gibt nur 1 logger, aber mehrere configs
    ==> Beim loggen die config mitgeben!

* Performance:
  - Chrome: Ausführung der UI-Tests via testacular ist langsam, wenn das
    Fenster nicht den Fokus hat!
    -> evtl. eine andere setTimeout-Funktion verwenden?
  - Firefox: Ausführung der Ui-Tests in den Popups is langsam, wenn das
    Popup nicht den Fokus hat!  

* Better error handling:
  - loading appends / prepends in requirejs
  - error event listener for general errors in iframes/popups

tests and cleanup:
- test on different browsers!!
  * Safari, Chrome, FF: OK!
  * IE?
- Check against rylc!
- Samples
  * include xhr mock
  * include angular-mocks in angular
  * include simulate
- Update build system to grunt.js, without ejs templates!
- Migration Guide form jasmine-ui
- Decision why to drop jasmine-ui:
  * too complicated
  * too complex to integrate other test languages
  * older browser support
  * idea of dependency injection in callbacks simplified things a lot!
  * browsers are now able to debug accross iframes!
