describe('angular-xhrmock', function() {
    var uit = uitest.current;

    uit.url("/examples/angularjs/xhrmock/index.html");
    uit.feature("angularIntegration");
    uit.append("../lib/angular-mocks.js");

    it('should load the page', function() {
        uit.runs(function() {
            expect(1).toBe(1);
        });
    });

    it('should mock backend calls', function() {
        var btnEl, resultEl,
            someData = "someData";
        uit.runs(function(document, angular, $httpBackend) {
            $httpBackend.whenGET('main.js').
                respond(someData);

            btnEl = document.getElementById("loadData");
            resultEl = document.getElementById("data");

            btnEl.click();

            $httpBackend.flush();
            expect(resultEl.textContent).toBe(someData);
        });
    });
});