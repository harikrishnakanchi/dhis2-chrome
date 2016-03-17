define(["uploadDatasetConsumer", "utils", "angularMocks", "datasetService"], function(UploadDatasetConsumer, utils, mocks, DatasetService) {
    describe("uploadDatasetConsumer", function() {
        var uploadDatasetConsumer, message, datasetService, q, scope;

        beforeEach(mocks.inject(function($q, $rootScope) {
            q = $q;
            scope = $rootScope.$new();

            datasetService = new DatasetService();
            spyOn(datasetService, "assignOrgUnitToDataset").and.returnValue(utils.getPromise(q, {}));

            uploadDatasetConsumer = new UploadDatasetConsumer(datasetService, q);
        }));

        it("should save each orgUnit to each dataset", function() {
            message = {
                data: {
                    data: {
                        orgUnitIds: ['orgUnit1', 'orgUnit2'],
                        dataSetIds: ['dataSetA', 'dataSetB']
                    },
                    type: "associateDataset"
                }
            };

            uploadDatasetConsumer.run(message);
            scope.$apply();

            expect(datasetService.assignOrgUnitToDataset).toHaveBeenCalledWith('dataSetA', 'orgUnit1');
            expect(datasetService.assignOrgUnitToDataset).toHaveBeenCalledWith('dataSetA', 'orgUnit2');
            expect(datasetService.assignOrgUnitToDataset).toHaveBeenCalledWith('dataSetB', 'orgUnit1');
            expect(datasetService.assignOrgUnitToDataset).toHaveBeenCalledWith('dataSetB', 'orgUnit2');
        });
    });
});
