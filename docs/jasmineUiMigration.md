Jasmine-UI Migration
====================

Architecture decision / change
--------------------

The predecessor of uitest was the project [Jasmine-Ui](https://github.com/tigbro/jasmine-ui). The main design idea there was to load the tests into the same window as the application under test, and reload the whole window for every test. This decision was based on the following facts:

- easy access of global variables of the app to be tested from within the test.
- layout debugging: the app to be tested had the whole window to display. By this,
  layout bugs could be detected easily, and mobile sites who used a `<meta name="viewport">` tag were displayed with the right zoom factor.
- test data created in the tests always used the prototypes of the app to be tested. This was especially useful for arrays.
- stepping from the test to the application was easy, as there was no iframe that separated both.

However, Jasmine-Ui had the following disadvantages:
- if Jasmine-Ui tests were run with a testrunner like testacular or JsTestDriver, it used a popup, which lead to problems with popup blockers, epscially on mobile devices
- Jasmine-Ui required a very tight integration with the test framework Jasmine-BDD, as it needed to stop test execution, execute only one test, ...
- The code base of Jasmine-Ui was very complex, which was caused by it's architecture.

To generalize Jasmine-Ui also for other test frameworks, we took another approach, which resulted in the framework uitest.js. Here, we took the (quite common) approach of always using an iframe, in which the app to be tested is loaded, and keep the tests separated.

This still includes the positive points of Jasmine-Ui:

- easy access to global variables of the app to be tested: This is implemented using dependency injection in callbacks.
- layout debugging: the iframe always uses 100% widht and height and is always added to the top window. For mobile sites, we also automatically copy the `<meta name="viewport"> tag from the iframe to the top window.
- correct prototypes: important frameworks (like angular.js) do no more rely on the correct origin of prototypes (e.g. by no more using `instanceof Array`).
- debugging: Modern browsers like Chrome allow to step accross iframe boundaries during debugging.

uitest.js also adds a lot of cool new features. Have a look at the Readme.md for details!

Migration Guide
----------------

Jasmine-Ui:

    describeUi('someSuite', 'someUrl', function() {
        beforeLoad(function() {
            someModule.init();
        });
        it('should do smth when clicked on the button', function() {
            $(".btn").click();
        });
    });

uitest.js:

    var uit = uitest.current;
    uit.feature("xhrSensor", "timeoutSensor", "intervalSensor");

    describe('someSuite', function() {
        uit.url('someUrl');

        uit.append(function(someModule) {
            someModule.init();
        });
        it('should do smth when clicked on the button', function() {
            uit.runs(function($) {
                $(".btn").click();
            });
        });
    });

Notes on the example:

- `describeUi` is replaced by a normal `describe` and a call to uitest.current.url within the suite.
    * Note that this is outside of any `beforeEach` or `afterEach`.
    * Note that this could also be placed inside an `it` to define
      a separate url for every test!
- access to global variables `someModule` and `$`:
    * In Jasmine-Ui, those variables could just be referenced, as the test and the app were run in the same frame
    * uitest.js uses dependency injection, i.e. you have to specify the global variables, that you want to access from the frame, as parameters to your function. uitest.js will automatically parse those arguments and resolve them from your app to be tested.
- In Jasmine-Ui, waiting for xhrs, intervals and timeouts was automatically enabled. However, in uitest.js these need to be enabled manually. This also gives the test the ability to deactivate some sensors.
- All calls to `uitest.current` are internally delegated to separate uitest instances, one for every suite and spec. Those uitest instances inherit from each other, according to the nesting of suites and specs. By this, properties defined in a suite apply to all specs in that suite, but properties defined in a spec do not apply to other specs.
