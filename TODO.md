TODO
----
cleanup scheint nicht zu funktionieren:
- entweder laufen alle tests als popup oder im iframe...
--> liegt an urlLoader.js!

features:
- requirejs support

* logger.log: Sollte man konfigurieren können
  (per default kein logging)  
  - Und: noch mehr loggen?
  - Idee: in config ein logLevel angeben  
  - Problem: es gibt nur 1 logger, aber mehrere configs
    ==> Beim loggen die config mitgeben!

* Fehler im iframe/popup als Fehler weiterreichen
  - wie? Evtl. beim nächsten Aufruf von inject, ...  
* Chrome: Ausführung der UI-Tests via testacular ist langsam, wenn das
  Fenster nicht den Fokus hat
  -> evtl. eine andere setTimeout-Funktion verwenden?

tests and cleanup:
- test on different browsers!!

- Delete old sources and tests.
- Check against rylc!
- Update build system to grunt.js, without ejs templates!
- Samples
  * include xhr mock
  * include angular-mocks in angular
  * include simulate
- Migration Guide form jasmine-ui
- Decision why to drop jasmine-ui:
  * too complicated
  * too complex to integrate other test languages
  * older browser support
  * idea of dependency injection in callbacks simplified things a lot!
  * browsers are now able to debug accross iframes!
