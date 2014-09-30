define(["datasetService", "angularMocks", "properties"], function(DatasetService, mocks, properties) {
    describe("dataset service", function() {
        var http, httpBackend, datasetService;

        beforeEach(mocks.inject(function($httpBackend, $http) {
            http = $http;
            httpBackend = $httpBackend;
            datasetService = new DatasetService(http);
        }));

        afterEach(function() {
            httpBackend.verifyNoOutstandingExpectation();
            httpBackend.verifyNoOutstandingRequest();
        });

        it("should update dataset", function() {
            var datasets = [{
                "id": "DS_Physio",
                "organisationUnits": [{
                    "name": "Mod1",
                    "id": "hvybNW8qEov"
                }]
            }];

            var expectedPayload = {
                dataSets: datasets
            };

            datasetService.associateDataSetsToOrgUnit(datasets);
            httpBackend.expectPOST(properties.dhis.url + "/api/metadata", expectedPayload).respond(200, "ok");
            httpBackend.flush();
        });
    });
});