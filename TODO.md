TODO
----
Allow runs with file:// protocol!
- in documentUtils.loadScript: xhr.status===0 ok for file urls!
- relative paths in uit.url:
  * if not absolute, use url of uitest.js as base path!
    --> how to determine url of uitest.js? -> see jasmine-ui.js!!
  * Then: change all paths in uispecs to relative paths!
- Note: Does not work in Chrome, but in Firefox and Safari!

--> Complete UiSpecrunner.html and add to Readme.md"

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

- Update build system to grunt.js, without ejs templates,
  and Travis-CI Build!
