TODO
----
Next:
- simulate oder analoge Methode...
- sensors: xhr, timeout, interval, ...

Set default sensors, but allow it to be overridden!
(e.g. set "xhr", ...).
-> Einfach in config.readySensors setzen!

Use injector in facade to wrap callbacks!
- ready: OK

Idee:
- Auch wenn kein jQuery da ist, trotzdem das Symbol "$" injecten lassen, 
  dass dann via document.querySelector arbeitet!
  Problem: jQuery gibt ja immer ein Array zurück...
  --> Das genauso machen! Also immer document.querySelectorAll ausführen!  

runs(function($) {
  var els = $(".someClass");
});


Add special syntactic sugar for Jasmine!
--> uitest.currentDelegate()
==> Sollte immer gleich heißen, egal ob für Jasmine, Mocha, QUnit!


Jasmine-Support:
- readyLatch nur in Jasmine-Support einbauen, nicht allgemein!
  -> In waitsForReady einbauen.
- injectBind auch nur in Jasmine-Support in runsInject einbauen!
  -> Kann inject verwenden!

==> Ziel: API sollte minimal und so einfach wie möglich sein!