Changelog
=====================

0.10.0
------
Features:

* No `<script>uitest.parent.instrument(window)</script>` in the application under test needed any more!

Breaking changes:

* The iframe for the application under test is no more added to the top most iframe (e.g. if using Karma Runner) as this resulted in memory problems on iOS.
* Tests that spawn multiple page reloads need to enable `feature('multiPage')`. However,
  waiting for the reload is done as usual using `.ready`. The method `.reloaded` is gone!
* Tests for pages that reload the page using a form and HTTP POSTs are no more supported!

0.9.1
------
Features:

* Added the wildcard `{now}` in urls to double the cache busting parameter somewhere else in the url.
* Using javascript urls for rewriting the document:
    - Adds xhtml support for most browsers, except FF and IE<=8.
    - Simplifies loading and makes workaround for IE unnecessary.
* Real IE7+ support


0.9
-------------
Initial release