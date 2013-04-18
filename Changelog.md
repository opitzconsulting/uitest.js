Changelog
=====================

0.10.0
------
Features:

* No `<script>uitest.parent.instrument(window)</script>` in the application under test needed any more!

Breaking changes:

* Tests that spawn multiple page reloads need to enable this using `feature('multiPage')`.
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