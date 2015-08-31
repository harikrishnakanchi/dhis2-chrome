define(["pivotTableService", "angularMocks", "properties", "utils"], function(PivotTableService, mocks, properties, utils) {
    describe("pivot table service", function() {
        var http, httpBackend, pivotTableService, q, scope, lastUpdatedAt;

        beforeEach(mocks.inject(function($injector, $q, $rootScope) {
            http = $injector.get('$http');
            q = $q;
            scope = $rootScope;
            httpBackend = $injector.get('$httpBackend');
            pivotTableService = new PivotTableService(http);
        }));

        afterEach(function() {
            httpBackend.verifyNoOutstandingExpectation();
            httpBackend.verifyNoOutstandingRequest();
        });

        it("should get chart data when the dimensions are category options", function() {
            var pivotTable = {
                "name": "some table"
            };
            var pivotTables = {
                "reportTables": [pivotTable]
            };

            httpBackend.expectGET(properties.dhis.url + "/api/reportTables.json?fields=:all&filter=name:like:Field+App&paging=false").respond(200, pivotTables);
            var actualData;
            pivotTableService.getAllPivotTables().then(function(data) {
                actualData = data;
                expect(data).toEqual([pivotTable]);
            });

            httpBackend.flush();
        });
    });
});