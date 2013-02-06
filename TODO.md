TODO
----
Next:
- integration tests without special jasmine syntax
  * for iframe and popup!
- function for simulate oder analoge Methode...
- integration tests with special jasmine syntax
- jasmine syntactic sugar
- better iframe css -> 
  body: { margin-bottom: screen-height }

- If all runs: requirejs support!


Jasmine-Support:
- uitest.current:
  * No function, but a delegate that always delegates
    to the uitest instance for the current test!
- global: runs
  * Integrate inject
  * Should also work in the outermost callback of an "it", e.g.
    it("should...", function(someGlobal) {

    });
- global: waitsForReady
  * Use a readyLatch for this.
    -> Remove readyLatch from general code!

==> Ziel: API sollte minimal und so einfach wie möglich sein!