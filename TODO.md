TODO
----
Refactoring-Status für run-Module:
- alles ok, bis auf Sensoren:
  * alle fast ok, bis auf Prüfung config.enableIntervalSensor
- UI-Tests laufen alle im UiSpecRunner.html!!
  * aber nicht mit testacular...

- Dann: UI-Tests wieder zum laufen bekommen,
  vor dem nächsten Refactoring!!

- Generisches Config-Modul!

add "logging"-Property to config-Module
-> later, when config is dynamic, this should be automatically
   added!
-> Doku dazu!   

TODO Mobile Support:
- run/mobileSupport.js:
  * kopiert <meta name="viewport"> vom testframe win global.top!
  ==> via einem config.appends!

TODO:
- wäre super, wenn die "config" generisch wäre.
  z.B. Module haben Abhängigkeiten "config/someProp" -> config analysiert das für alle Module und erzeugt die entspr. Property.
  - Validierung des Wertes erst, wenn das Modul erzeugt wird (das ist aber auch ok, macht Angular auch so).
  - Problem: Unterscheidung zw. Arrays und Nicht-Arrays
  - Problem: Unterscheidung zw. mergable und nicht-mergable arrays.
- Lösung Idee 1:
    * arrays haben "s" am Schluss    
    * readySensors-Property weg, dafür für jeden Sensor eine eigene Property:
      "intervalSensorEnabled", "timeoutSensorEnabled", ...
    * Folge: Alle Arrays sind mergable...
- andere Lösung:
  * Im Aufruf von define nicht nur einen String angeben, sondern ein Objekt!
    z.B. define('mySensor', [
    {configProp: 'appends', isMergableArray: true}
    ], function() { ... });
- Eigentlich muss ich nur zw. mergable Array und allem anderen unterscheiden...
  * Das sollte über speziellen Namen gehen:
    "config/mergeArray/someProp"
    "config/someProp"
  ==> Das machen! Wenn die config erzeugt wird,
      wird require nach allen Modulnamen und deren Dependencies gefragt
      (require.listDependencies())


Für Demo für Nils und SSC:
- Rylc-Tests komplett umstellen
  ==> auch testutils
- Dann sieht man alle Features
  * leichte Syntax
  * intercept
  * uitest.current.runs mit Dep. Injection.
  * ...  




features:
- jasmineSugar.js:
  uitest.runs weg, dafür uitest.current.runs
  ==> Man arbeitet dann immer nur mit uitest.current!

- requirejs in ff geht nicht. warum?
- refactoring:
  
  * documentUtils.loadAndEvalScript
    ==> Tests dafür machen!

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

* logger.log: Sollte man konfigurieren können
  (per default kein logging!)
  - Und: noch mehr loggen?
  - Idee: in config ein logLevel angeben  
  - Problem: es gibt nur 1 logger, aber mehrere configs
    ==> Beim loggen die config mitgeben!

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
