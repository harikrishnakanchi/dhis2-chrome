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

        it("should download datasets", function() {

            var actualDataSets;
            datasetService.getAll().then(function(data) {
                actualDataSets = data;
            });

            var datasets = [{
                'id': 'ds1'
            }];

            var responsePayload = {
                'dataSets': datasets
            };

            httpBackend.expectGET(properties.dhis.url + "/api/datasets.json?fields=:all&paging=false").respond(200, responsePayload);
            httpBackend.flush();

            expect(actualDataSets).toEqual(responsePayload.dataSets);
        });
    });
});