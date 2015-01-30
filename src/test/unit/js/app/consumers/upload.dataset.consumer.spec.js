define(["uploadDatasetConsumer", "utils", "angularMocks", "datasetService", "datasetRepository"], function(UploadDatasetConsumer, utils, mocks, DatasetService, DatasetRepository) {
    describe("uploadDatasetConsumer", function() {
        var uploadDatasetConsumer, message, datasetService, datasetRepository, q, allDatasets, scope;

        beforeEach(mocks.inject(function($q, $rootScope) {
            q = $q;
            scope = $rootScope.$new();

            datasetService = new DatasetService();
            datasetRepository = new DatasetRepository();

            allDatasets = [{
                "id": "ds1",
                "name": "Dataset1"
            }, {
                "id": "ds2",
                "name": "Dataset2"
            }, {
                "id": "ds3",
                "name": "Dataset3"
            }];
        }));

        it("should save datasets to dhis", function() {
            spyOn(datasetService, "associateDataSetsToOrgUnit").and.returnValue(utils.getPromise(q, {}));
            spyOn(datasetRepository, "getAll").and.returnValue(utils.getPromise(q, allDatasets));
            uploadDatasetConsumer = new UploadDatasetConsumer(datasetService, datasetRepository);

            message = {
                data: {
                    data: ["ds1", "ds2"],
                    type: "associateDataset"
                }
            };

            uploadDatasetConsumer.run(message);
            scope.$apply();
            expect(datasetService.associateDataSetsToOrgUnit).toHaveBeenCalledWith([allDatasets[0], allDatasets[1]]);
        });
    });
});
