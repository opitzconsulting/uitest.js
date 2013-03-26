[![Build Status](https://travis-ci.org/tigbro/uitest.js.png)](https://travis-ci.org/tigbro/uitest.js)
#uitest.js

## Description

uitest.js is able to load a webpage into a frame,
instrument that page and the javascript in that page (e.g. add additional scripts at the end
of the document, ...) and execute actions on that page.

uitest.js can be used standalone or with any testframework.
However, there is also some syntactic sugar so that it integrates more easily into
test frameworks.

## Features

* Layout Debugging during test runs:
    - Uses an 100% width/height iframe to see the real layout of the application.
    - Adds a button to toggle between the iframe and the testrunner.
    - Mobile support: Adds/removes a `<meta name="viewport">` tag in the top window
      depending on the `<meta>` tag in the current page to be tested.
* Instrumentations for a page:
    - add a script or function at the beginning/end of the page
    - intercept calls to any named function on the page, no matter if the function is global or not
* Cache busting feature to always fetch the recent versions of scripts in pages.
* Wait for the end of asynchronous work, e.g. xhr, setTimeout, setInterval, page loading, ...
  This can be easily extended.
* Easy access to global variables of the app to be tested in the test case using dependency injection.
* Extended integration with frameworks:
    - angular.js for mocking backend calls
    - mobile sites for automatically adjusting the viewport
    - testframeworks: syntactic sugar for Jasmine BDD, ...
* Compatibility:  
    * Testframeworks: Use any test framework and test runner, can also run standalone.
    * Supports applications that use requirejs 2.x.
    * Browsers: Chrome, Firefox, IE7+, Safari, Mobile Safari, Android Browser 2.3+.
    * Supports running tests from `file://` urls (Safari and chrome with command line argument `--disable-web-security`)
* Dependencies:
    * No additional JS libs required
    * Does not need any additional test server, only a browser to execute the tests
* Supports xhtml on many browsers. 
    * Not on FF (as FF does uses `javascript:` urls in 
  a special way :-( )
    * Not on IE<=8, as IE<=8 is not able to load xhtml in an iframe
      (error XML5632: only one root element is allowed).


## Usage

1. include uitest.js as library into your test-code.
2. In the pages that should be tested, include the following line as first line in the header:
   `<script type="text/javascript">parent.uitest && parent.uitest.instrument(window);</script>`
2. create a uitest instance calling `uitest()`.
3. configure the instance, e.g. setting setting `<uitest>.url('someUrl')`.
4. run the test page, e.g. by calling `<uitest>.ready`.

Preconditions:

* The page to be tested must be loaded from the same domain as the test code.

## Samples
See the ui tests under `test/ui/*Spec.js`.

## Reporting Bugs
Please use this [Plunk](http://plnkr.co/edit/rGCvTXINKVv4B4lqM6gv) as starting point.

## Build
Directory structure

- compiled: The created versions of uitest.js
- src: The main files of uitest.js
- test/ui: The ui self tests for uitest.js
- test/unit: The unit tests of uitest.js

Install the dependencies: `npm install`.

Build it: `./node_modules/.bin/grunt`

- set the right path to phantomjs before, e.g. `export PHANTOMJS_BIN=./node_modules/.bin/phantomjs`.

Auto-Run tests when file change: `./node_modules/.bin/grunt dev`

## API

#### Factories
* `uitest.create()`: Creates a new uitest instance.
* `uitest.current`: A singleton that delegates all functions to the 
  "current" uitest instance. This is different for every testframework,
  see below for details.

#### Configuration
At first, every uitest instance is in configuration mode. In this mode, the following
methods are available

* `parent(uitest)`: connects this uitest instance with the given parent uitest
  instance, so that all properties are inherited / merged during runtime.
  Note that the link is live, i.e. changing the parent
  after calling this also affects the child.

* `url(someUrl)`:
Sets the url of the page ot be loaded. If the url is relative, it will be resolved relative to the
path of the `uitest.js` in the current page.
Please note that to prevent caching issues, and also to allow to only change
the hash between different tests, all pages will get a further query parameter containing the current time. E.g. setting a url `/someUrl` will result in a location of `/someUrl?12345`. If you need that query parameter doubled somewhere else in your url, use `{now}`. E.g. an url of `/someUrl?check={now}` will yield to a location of `/someUrl?check=12345&12345`.

* `trace(boolean)`:
Enables debug logging for several features.

* `prepend(someScriptUrl | callback)`:
Adds the given script or an inline script that calls the given callback at the beginning of the `<head>` of the document to be loaded. The callback is called using dependency injection, see below.

* `append(someScriptUrl | callback)`:
Adds the given script or an inline script that calls the given callback at the end of the `<body>` of the document to be loaded.

* `intercept({script: 'someScript', fn: 'someFnName', callback: callback})`
Intercepts all calls to functions with the name `someFnName` in scripts whose filename is `someScript`. The function
does not need to be a global function, but may also be a nested function definition.
The script name must be provided without a folder, and will match all script urls ignoring their folders too.
The callback is called using dependency injection, using the argument names
of the original function and all global variables. The argument with the special name `$delegate` will
contain the following data: `{fn: ..., name: 'someFnName, self: ..., args: ...}`, allowing access to the original function, the original `this` and `arguments` properties. The original function can be called by calling the given `fn` function.

* `feature('feature1', 'feature2', ...)`
Enables the given features. 


#### Running the test page
On the first call to the `ready` function on the uitest instance, the iframe gets created,
and all configuration is applied. Now the uitest is in running mode, and the following methods
may be called. 

Please note that the iframe is shared between all uitest instances.

* `ready(callback)`: Waits until all ready sensors say the test page is ready. On the first call, this will also
  load the test page into the iframe.
  The callback is called using dependency injection. See below for details about ready sensors.

* `reloaded(callback)`: Waits until the testpage has been reloaded and is ready again.
  This is useful for testing pages that do a form submit or link to other pages.
  The callback is called using dependency injection, see below.

* `inject(callback)`: Calls the given callback using dependency injection.

## Dependency Injection

Many methods in the API take a callback whose arguments can use dependency injection. For this,
the names of the arguments of the callback are inspected. The values for the callback arguments 
then are the globals of the test frame with the same name as the arguments.

E.g. a callback that would have access to the jQuery object of the test frame: `function($) { ... }`.


## Ready sensors

The following ready sensors are built-in. To enable them, they have to be enabled as feature:

* `feature('xhrSensor')`: Waits for the end of all xhr calls
* `feature('timeoutSensor')`: Waits for the end of all `setTimeout` calls
* `feature('intervalSensor')`: Waits for the end of all `setInterval` calls (via `clearInterval`).
* `feature('jqmAnimationSensor')`: waits for the end calls to `$.fn.animationComplete` (jQuery mobile 
   event listener for css3 animations).


## Jasmine-BDD syntactic sugar
To make it easier to use uitest together with jasmine, a separate uitest instance
is created for every suite and every spec. The uitest instance for a spec/suite
inherits from the uitest instance of the parent suite using the `parent` instance. 

The following additional functions exist for Jasmine-BDD:

- `uitest.current`: This returns a singleton uitest instance,
  whose functions delegate to the current uitest instance of the spec/suite.  
- `uitest.current.runs(callback[,timeout])`: First, this executes a `waitsFor` call using `uitest.current.ready`.
Then it executes the the given callback using a `runs` call from jasmine and does dependency injection for the arguments of the callback using `uitest.current.inject`.
- `uitest.current.runsAfterReload(callback[,timeout])`: First, this executes a `waitsFor` call using `uitest.current.reloaded`.
Then it executes the the given callback using a `runs` call from jasmine and does dependency injection for the arguments of the callback using `uitest.current.inject`.


## Angular-Js Support
The `feature('angularIntegration')` enables angular.js support in uitest:

#### Mocking the backend using `angular-mocks.js`:

Angular provides a special library for unit testing, `angular-mocks.js`. This library contains a mock `$httpBackend` that can be programmed to return fake responses (see [http://docs.angularjs.org/api/ngMock.$httpBackend](http://docs.angularjs.org/api/ngMock.$httpBackend)). The `feature('angularIntegration')` automatically enables this mock backend, so you can program and verify xhr calls just like unit tests. E.g.

    var uit = uitest.current;
    uit.feature("angularIntegration");
    uit.append("lib/angular-mocks.js");

    uit.runs(function($httpBackend) {
        $httpBackend.whenGet(...);
        ...
        $httpBackend.flush();
    });
    

#### Extended dependency injection:

now you can use angular services for dependency injection at all places, e.g. in `uitest.current.runs` to access angular services of the app to be tested. E.g.
        
    var uit = uitest.current;
    uit.feature("angularIntegration");

    uit.runs(function($rootScope) {
        ...
    });


## Mobile Viewport Support
Mobile applications usually control the viewport of an application using a `<meta name="viewport">` tag to adjust the zoom level of the browser.

The `feature('mobileViewport')` automatically copies this `<meta>` tag form the iframe to the top window so that the zoom level is correct, although the app is loaded in an iframe.


## Cache buster
Somtimes, the cache in the browser keeps an old copy of the scripts that we stored on the server or file system. A simple solution for this is to add a query parameter with an always changing id to every script tag. This is exactly, what the `feature("cacheBusting")` does for normal scripts as well as for scripts included by requirejs.

Note: If you want to create breakpoints in your browser while cache busting is activated,
use the `debugger;` statement in your scripts to manually stop the browser.


## Supporting libraries

Triggering events:

- See the notes from QUnit on this topic:
[http://qunitjs.com/cookbook/#testing_user_actions](http://qunitjs.com/cookbook/#testing_user_actions)
- use `jQuery.trigger` if you are using jQuery in your application.

Mocking the backend:

- Use [https://github.com/philikon/MockHttpRequest/blob/master/lib/mock.js](https://github.com/philikon/MockHttpRequest/blob/master/lib/mock.js) with the `prepend` function. 

## License
Copyright (c) 2013 Tobias Bosch  
Licensed under the MIT license.

