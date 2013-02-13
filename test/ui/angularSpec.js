describe('angular-xhrmock', function() {
    var uit = uitest.current,
        btnEl, resultEl;

    uit.url("/base/test/ui/fixtures/angular.html");
    uit.feature("angularIntegration");
    uit.append("../../lib/angular-mocks.js");

    it('should mock backend calls', function() {
        var someData = "someData";
        uit.runs(function(document, angular, $httpBackend) {
            $httpBackend.whenGET('angularApp.js').
                respond(someData);

            btnEl = document.getElementById("loadData");
            resultEl = document.getElementById("data");

            btnEl.click();

            $httpBackend.flush();
            expect(resultEl.textContent).toBe(someData);
        });
    });

    it('should mock a controller', function() {
        var loadData = jasmine.createSpy('loadData');
        uit.intercept({fn: 'loadData', script: 'angularApp.js', callback: loadData});
        uit.runs(function(document) {
            btnEl = document.getElementById("loadData");
            btnEl.click();
            expect(loadData).toHaveBeenCalled();
        });

    });
});