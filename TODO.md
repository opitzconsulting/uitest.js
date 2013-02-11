TODO
----

TODO Mobile Support:
- run/mobileSupport.js:
  * kopiert <meta name="viewport"> vom testframe win global.top!
  ==> via einem config.appends!

Für Demo für Nils und SSC:
- Rylc-Tests komplett umstellen
  ==> auch testutils
- Dann sieht man alle Features
  * leichte Syntax
  * intercept
  * uitest.current.runs mit Dep. Injection.
  * ...  

features:
- requirejs in ff geht nicht. warum?

- requirejs support:
  * impl ok, ui tests ok.
  * 1. unit tests are missing!
  * 2. better matching between scriptUrl and the url provided by requirejs
    (requirejs appends a "./")
    --> Only check the filename without the path!

- 3. iframe: better display:
  * 100% width / height is ok
  * Add button: Switch z-index between -100 and +100
  * Always add it to the "top"-frame
  --> And: Remove Popup-Mode!

  For mobile sites:
  * as "append"-script: check the child iframe for a "meta"-tag in the head.
    If present, add it also to the top frame
    ==> Does work in ios and android, also when that frame has already loaded!!
    ==> Zoom is correct!!
  * Remove the "meta"-tag from top on cleanup!
    
  ==> Add in Readme!!  

- Migration Guide form jasmine-ui
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
- Check against rylc!
- Samples
  * include xhr mock
  * include angular-mocks in angular
  * include simulate

Later
---------
- syntactic sugar for other testfkws:
  * Mocha
  * QUnit

* Performance:
  - Chrome: Ausführung der UI-Tests via testacular ist langsam, wenn das
    Fenster nicht den Fokus hat!
    -> evtl. eine andere setTimeout-Funktion verwenden?

* Better error handling:
  - error event listener for general errors in iframes/popups
* Check memory consumption / garbage collection:
  - run a lot of tests (WITHOUT the browser inspector on),
    then open the inspector and look at the loaded scripts...    

- Update build system to grunt.js, without ejs templates!
