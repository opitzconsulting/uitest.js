TODO
----
- test on more browsers:
  * Safari, Chrome, FF, Mobile Safari, IE10: OK
  * IE 9? -> not working yet. Somehow, document.open();document.write();document.close() does not work.
    - IE9: testacular has wrong console.log implementation (calls .apply on it, which IE9 does not like...)
      --> maybe I use an old version?!
    - IE9: UiSpecRunner.html works now for ui/basicSpec.js!
    - IE9: but not with testacular!
  * Android browser?

- syntactic sugar for other testfkws:
  * Mocha
  * QUnit

* Performance if the browser-tab is in the background:
  - In chrome, executing ui tests via testacular is slow if
    the browser-tab is in the background (i.e. another tab is open and focused).

* Better error handling:
  - error event listener for general errors in iframes
  - how to report? On the next call to ready/inject/...?
