define(["dataService", "angularMocks", "properties"], function(DataService, mocks, properties) {
    describe("dataService", function() {
        var httpBackend, http;

        beforeEach(mocks.inject(function($injector, $q) {
            q = $q;
            httpBackend = $injector.get('$httpBackend');
            http = $injector.get('$http');
        }));

        afterEach(function() {
            httpBackend.verifyNoOutstandingExpectation();
            httpBackend.verifyNoOutstandingRequest();
        });

        it("should save datavalues to dhis", function() {
            var dataValues = {
                "blah": "blah"
            };

            var dataService = new DataService(http);
            dataService.save(dataValues);

            httpBackend.expectPOST(properties.dhis.url + "/api/dataValueSets", dataValues).respond(200, "ok");
            httpBackend.flush();
        });

    });
});