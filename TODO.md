TODO
----
Unit-Tests for angular-integration!
* especiall for adapting the Array-Prototype!

UI-Test für inject

Unit-Test for runsAfterReload in jasmineSugar.js

test on different browsers:
  * Safari, Chrome, FF: OK
  * Mobile Safari: OK
  * IE?

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
