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

            httpBackend.expectGET(properties.dhis.url + "/api/dataSets.json?fields=:all&paging=false").respond(200, responsePayload);
            httpBackend.flush();

            expect(actualDataSets).toEqual(responsePayload.dataSets);
        });

        it("should download all datasets since lastUpdated", function() {
            var lastUpdatedTime = "2015-08-06T17:51:47.000Z";
            var responsePayload = {
                'dataSets': []
            };

            datasetService.getAll(lastUpdatedTime);

            httpBackend.expectGET(properties.dhis.url + "/api/dataSets.json?fields=:all&paging=false&filter=lastUpdated:gte:" + lastUpdatedTime).respond(200, responsePayload);
            httpBackend.flush();
        });

        it("should load pre-packaged dataset data", function() {
            var dataSetsFromFile = {
                "dataSets": [{
                    "id": "ds1"
                }]
            };

            httpBackend.expectGET("/data/dataSets.json").respond(200, dataSetsFromFile);

            var actualResult;
            datasetService.loadFromFile().then(function(result) {
                actualResult = result;
            });
            httpBackend.flush();

            expectedDataSets = [{
                "id": "ds1"
            }];

            expect(actualResult).toEqual(expectedDataSets);
        });

        it('should assign orgunit to dataset', function() {
            var datasetId = 'datasetId';
            var orgUnitId = 'orgUnitId';

            datasetService.assignOrgUnitToDataset(datasetId, orgUnitId);

            httpBackend.expectPOST(properties.dhis.url + '/api/dataSets/' + datasetId + '/organisationUnits/' + orgUnitId).respond(204);
            httpBackend.flush();
        });

    });
});
