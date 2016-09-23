define(["updateDataSetConsumer", "utils", "angularMocks", "dataSetService"], function(UpdateDatasetConsumer, utils, mocks, DatasetService) {
    describe("updateDatasetConsumer", function() {
        var updateDatasetConsumer, message, datasetService, q, scope;

        beforeEach(mocks.inject(function($q, $rootScope) {
            q = $q;
            scope = $rootScope.$new();

            datasetService = new DatasetService();
            spyOn(datasetService, "assignOrgUnitToDataset").and.returnValue(utils.getPromise(q, {}));

            updateDatasetConsumer = new UpdateDatasetConsumer(datasetService, q);
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

            updateDatasetConsumer.run(message);
            scope.$apply();

            expect(datasetService.assignOrgUnitToDataset).toHaveBeenCalledWith('dataSetA', 'orgUnit1');
            expect(datasetService.assignOrgUnitToDataset).toHaveBeenCalledWith('dataSetA', 'orgUnit2');
            expect(datasetService.assignOrgUnitToDataset).toHaveBeenCalledWith('dataSetB', 'orgUnit1');
            expect(datasetService.assignOrgUnitToDataset).toHaveBeenCalledWith('dataSetB', 'orgUnit2');
        });
    });
});
