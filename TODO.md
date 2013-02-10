TODO
----
Neues Modul-System:
- require benötigt als Pflichtparameter einen "cache"
  ==> es gibt keinen global Cache mehr.
  ==> brauche kein factory-Plugin mehr, rufe in den Tests
      einfach require mit einem neuen Cache auf!
  require(cache, ['dep1']) -> cache (gefüllt)
- Initial wird nur "facade" required, das von "config" abhängt.
- Beim Übergang von config -> run state, wird erneut required,
  und zwar alle Module außer "facade" (via filter),
  und im Cache wird "config" vorbelegt
  (besser: alle "run"-Module unter Pfad "/run/..." registrieren!)
  ==> z.B. Logger kann seinen Log-Level auslesen und erzeugt
      eine Instanz das direkt dieses Log-Level verwendet
  * logger verwendet config.logLevel
  * instrumentor:
    - verwendet config.appends, config.prepends, config.intercepts
    - alle bisherigen Funktionen in "internal" Objekt exportieren
    - neue Schnittstelle: "append", "prepend", "intercept"
      ==> fügt neue Einträge ein, aber VOR denen von config.appends/config.prepends, ...
  * urlLoader:
    - verwendet config.url
    - erzeugt direkt den frame, falls notwendig
    - ruft sofort "open" auf
    - keine öffentliche Schnittstelle nach außen
  * ready:
    - öffentliche Schnittstelle: addSensor("name", sensorInstance)
      -> dort wird jetzt keine factory, sondern schon der Sensor selber registriert!
  * jeder Sensor:
    - verwendet config.loadSensors
    - ruft evtl. instrumentor.append/instrumentor.prepend/... auf
    - ruft ready.addSensor auf.
  * loadSensor:
    - hat öffentliche Methode "reloaded(callback)"
      ==> setzt internes Flag und ruft dazu ready.ready(callback) auf...
- Für facade.reloaded:
  * einfach an loadSensor.reloaded delegieren.

Folge:
- Code in facade wird deutlich einfacher, so etwas wie:
  this.runModules = require.all({}, function(modName) { return modName!=='facade'});
  
  reloaded: function(callback) { return this.runModules.loadSensor.reloaded(callback); }
--> Kein Herumreichen der "runInstance" mehr...

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
