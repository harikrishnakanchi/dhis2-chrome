define(["dataSetService", "angularMocks", "properties", "metadataConf", "pagingUtils"], function(DatasetService, mocks, properties, metadataConf, pagingUtils) {
    describe("dataset service", function() {
        var http, httpBackend, datasetService, q;

        beforeEach(mocks.inject(function($httpBackend, $http, $q) {
            http = $http;
            q = $q;
            httpBackend = $httpBackend;
            datasetService = new DatasetService(http, q);
        }));

        afterEach(function() {
            httpBackend.verifyNoOutstandingExpectation();
            httpBackend.verifyNoOutstandingRequest();
        });

        it("should download datasets with pagination", function() {
            var actualDataSets;
            spyOn(pagingUtils, 'paginateRequest').and.callThrough();

            datasetService.getAll().then(function(data) {
                actualDataSets = data;
            });

            var datasets = [{
                'id': 'ds1'
            }];

            var url = properties.dhis.url + "/api/dataSets.json?fields=" + metadataConf.fields.dataSets + "&page=1&paging=true&totalPages=true";
            var responsePayload = {
                'dataSets': datasets
            };

            expect(pagingUtils.paginateRequest).toHaveBeenCalled();
            httpBackend.expectGET(encodeURI(url)).respond(200, responsePayload);
            httpBackend.flush();

            expect(actualDataSets).toEqual(responsePayload.dataSets);
        });

        it("should download all datasets since lastUpdated", function() {
            var lastUpdatedTime = "2015-08-06T17:51:47.000Z";
            var responsePayload = {
                'dataSets': []
            };

            var url = properties.dhis.url + "/api/dataSets.json?fields="+ metadataConf.fields.dataSets +"&filter=lastUpdated:gte:" + lastUpdatedTime + "&page=1&paging=true&totalPages=true";
            datasetService.getAll(lastUpdatedTime);

            httpBackend.expectGET(encodeURI(url)).respond(200, responsePayload);
            httpBackend.flush();
        });

        it("should load pre-packaged dataset data", function() {
            var dataSetsFromFile = {
                "dataSets": [{
                    "id": "ds1"
                }]
            };

            httpBackend.expectGET("data/dataSets.json").respond(200, dataSetsFromFile);

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

        it("should load empty dataset data if local file does not exist", function() {
            httpBackend.expectGET("data/dataSets.json").respond(404);

            var actualResult;
            datasetService.loadFromFile().then(function(result) {
                actualResult = result;
            });
            httpBackend.flush();

            expect(actualResult).toEqual([]);
        });

        it('should remove orgunit from dataset', function() {
            var datasetId = 'datasetId';
            var orgUnitId = 'orgUnitId';

            datasetService.removeOrgUnitFromDataset(datasetId, orgUnitId);

            httpBackend.expectDELETE(properties.dhis.url + '/api/dataSets/' + datasetId + '/organisationUnits/' + orgUnitId).respond(204);
            httpBackend.flush();
        });

        it('should not fail if orgunit is already removed from dataset', function() {
            var datasetId = 'datasetId';
            var orgUnitId = 'orgUnitId';

            var success = false;
            datasetService.removeOrgUnitFromDataset(datasetId, orgUnitId).then(function () {
                success = true;
            });

            httpBackend.expectDELETE(properties.dhis.url + '/api/dataSets/' + datasetId + '/organisationUnits/' + orgUnitId).respond(404);
            httpBackend.flush();
            expect(success).toBeTruthy();
        });
    });
});
