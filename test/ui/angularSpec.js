describe('angular-xhrmock', function() {
    var uit = uitest.current,
        btnEl, resultEl;

    uit.url("../test/ui/fixtures/angular.html");
    uit.feature("angularIntegration");
    uit.append("../../lib/angular-mocks.js");

    it('should integrate angulars dependency injection', function() {
        var someData = "someData";
        uit.runs(function(document, $browser) {
            expect(document.createElement).toBeDefined();
            expect($browser.url).toBeDefined();
        });
    });

    it('should allow filters to work with arrays created in tests (i.e. with different prototypes)', function() {
        uit.runs(function(filterFilter, limitToFilter, orderByFilter) {
            expect(filterFilter([1,2],1)).toEqual([1]);
            expect(filterFilter(null)).toEqual(null);
            expect(limitToFilter([1,2],1)).toEqual([1]);
            expect(limitToFilter(null)).toEqual(null);
            expect(orderByFilter([{a:2},{a:1}], 'a')).toEqual([{a:1},{a:2}]);
            expect(orderByFilter(null)).toEqual(null);
        });

    });

    it('should mock backend calls', function() {
        var someData = "someData";
        uit.runs(function(document, angular, $httpBackend) {
            $httpBackend.whenGET('angularApp.js').
                respond(someData);

            btnEl = document.getElementById("loadData");
            resultEl = document.getElementById("data");

            btnEl.click();

            $httpBackend.flush();
            expect(resultEl.innerHTML).toBe(someData);
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