uitest.js
=====================

Description
-------------

uitest.js is able to load a webpage into a frame or popup,
instrument that page and the javascript in that page (e.g. add additional scripts at the end
of the document, ...) and execute actions on that page.

uitest.js can be used standalone or with any testframework.

There is also some syntactic sugar so that it integrates more easily into
test frameworks.
TODO add details about this!

Features
---------

* Iframes and popups supported: iframes are good for debugging JavaScript, popups are good to see the real layout,
  especially for mobile applications.
* Instrumentations for a page:
    - add a script or function at the beginning/end of the page
    - intercept calls to any named function on the page, no matter if the function is global or not
* Wait for the end of asynchronous work, e.g. xhr, setTimeout, setInterval, page loading, ...
  This can be easily extended.
* Compatible with any test frameworks, can also run standalone.
* Does not need any additional test server, only a browser to execute the tests
* Supports applications that use requirejs 2.x.
* Supports: Chrome, Firefox, IE9+, Safari, Mobile Safari, Android Browser.


Usage
----------

1. include uitest.js as library into your test-code.
2. In the pages that should be tested, include the following line as first line in the header:
   `<script type="text/javascript">(opener||parent).uitest && (opener||parent).uitest.instrument(window);</script>`
2. create a uitest instance calling `uitest()`.
3. configure the instance, e.g. setting setting `<uitest>.url('someUrl')`.
4. run the test page, e.g. by calling `<uitest>.ready`.

Preconditions:

* The page to be tested must be loaded from the same domain as the test code.


Sample
------------
TODO

Build
--------------
Install the dependencies: `npm install`.

Run the tests:

* Unit-tests:
    1. run testacular: ./node_modules/.bin/testacular start testacular.ui.conf.js
    2. open `http://localhost:9876` with a browser to test in
* Ui-Tests:
    1. Run `node server.js` from a command line
    2. Run testacular: ./node_modules/.bin/testacular start testacular.ui.conf.
    3. open `http://localhost:9876` with a browser to test in

Create a new version:

* set the version in the package.json
* execute node build.js

Directory structure
----------------

- compiled: The created versions of uitest.js
- src: The main files of uitest.js
- test/ui: The ui self tests for uitest.js
- test/unit: The unit tests of uitest.js


API
-----------

#### Factories
`uitest.create()`
Creates a new uitest instance.

`uitest.create(parent)`
Creates a new uitest which inherits the configuration
of the given parent uitest. Note that the link is live, i.e. changing the parent
after creating the child also affects the child.

#### Configuration
At first, every uitest instance is in configuration mode. In this mode, the following
methods are available

* `mode("frame"|"popup")`:
Sets whether the test page should be loaded inside an iframe or a popup.

* `url(someUrl)`:
Sets the url of the page ot be loaded

* `prepend(someScriptUrl | callback)`:
Adds the given script or an inline script that calls the given callback at the beginning of the `<head>` of the document to be loaded. The callback is called using dependency injection, see below.

* `append(someScriptUrl | callback)`:
Adds the given script or an inline script that calls the given callback at the end of the `<body>` of the document to be loaded.

* `intercept({scriptUrl: 'someScriptUrl', fnName: 'someFnName', callback: callback})`
Intercepts all calls to functions with the given name in scripts with the given scriptUrl. The function
does not need to be a global function, but may also be a nested function definition.
The callback is called using dependency injection, using the argument names
of the original function and all global variables. The argument with the special name `$delegate` will
contain the following data: `{fn: ..., name: 'someFnName, self: ..., args: ...}`, allowing access to the original function, the original `this` and `arguments` properties. The original function can be called by calling the given `fn` function.

* `readySensors(['xhr', '...'])`
Sets the ready sensors to be used. For every sensor name used here a sensorFactory needs to be registered first. Details see below.


#### Running the test page
On the first call to the `ready` function on the uitest instance, the frame / popup gets created,
and all configuration is applied. Now the uitest is in running mode, and the following methods
may be called. 

Please note that the iframe / popup is shared between all uitest instances.Especially in 
popup mode this prevents too many open windows. 

* `ready(callback)`: Waits until all sensors say the test page is ready. On the first call, this will also
  load the test page into the iframe/popup.
  The callback is called using dependency injection, see below.

* `reloaded(callback)`: Waits until the testpage has been reloaded and is ready again.
  This is useful for testing pages that do a form submit or link to other pages.
  The callback is called using dependency injection, see below.

* `inject(callback)`: Calls the given callback using dependency injection.

#### Cleaning up
After all tests have been run, you might want to remove the iframe or close the popup. 

* `uitest.cleanup()`: this will remove the iframe / close the popup if it exists. Otherwise this does nothing.


Dependency Injection
---------------------

Many methods in the API take a callback whose arguments can use dependency injection. For this,
the names of the arguments of the callback is inspected. The values for the callback arguments 
then are the globals of the test frame with the same name as the arguments.

E.g. a callback that would have access to the jQuery object of the test frame: `function($) { ... }`.


Ready sensors
--------------

For every ready sensor a sensor factory needs to be registered first. 
The following sensors are built-in and already registered:

* `xhr`: Waits for the end of all xhr calls
* `timeout`: Waits for the end of all `setTimeout` calls
* `interval`: Waits for the end of all `setInterval` calls (via `clearInterval`).
* `$animation`: waits for the end calls to `$.fn.animationComplete` (jQuery mobile 
   event listener for css3 animations).

Creating a custom ready sensor:

1. define a factory function 
`function({prepend: function, append: function})`. This function is called for every reload of the test frame and may instrument that test frame using the 
given methods `prepend` or `append` (see above). 

2. The sensor factory needs to return the sensor instance for that frame. A sensor instance is a function that returns the following data:

        {
          count: 0, // The number of times the sensor was not ready
          ready: true // If the sensor is currently ready
        }

3. Register the sensor factory with the ready module:

        uitest.require(['ready'], function(ready) {
          ready.addSensorFactory('someSensorName', someSensorFactory);
        });


Simulation of Browser-Events
----------------------------

TODO

See also the notes from QUnit about this topic:
[http://qunitjs.com/cookbook/#testing_user_actions](http://qunitjs.com/cookbook/#testing_user_actions)

#### Use `jQuery.trigger`
This does _not_ fire the underlying browser event, but only triggers
event handlers registered by jquery. I.e. this can not be used for
event listeners attached without jquery! Also, this does not do the default navigation of anchor links!



