define(["updateDatasetConsumer", "utils", "angularMocks", "datasetService", "datasetRepository"], function(UpdateDatasetConsumer, utils, mocks, DatasetService, DatasetRepository) {
    describe("updateDatasetConsumer", function() {
        var updateDatasetConsumer, message, datasetService, q, scope, datasetRepository;

        beforeEach(mocks.inject(function($q, $rootScope) {
            q = $q;
            scope = $rootScope.$new();

            datasetService = new DatasetService();
            spyOn(datasetService, "assignOrgUnitToDataset").and.returnValue(utils.getPromise(q, {}));

            datasetRepository = new DatasetRepository();

            updateDatasetConsumer = new UpdateDatasetConsumer(datasetService, q, datasetRepository);
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

        it("should save datasets to dhis", function() {
            var allDatasets = [{
                "id": "ds1",
                "name": "Dataset1"
            }, {
                "id": "ds2",
                "name": "Dataset2"
            }];
            spyOn(datasetService, "associateDataSetsToOrgUnit").and.returnValue(utils.getPromise(q, {}));
            spyOn(datasetRepository, "findAllDhisDatasets").and.returnValue(utils.getPromise(q, allDatasets));

            message = {
                data: {
                    data: ["ds1", "ds2"],
                    type: "associateDataset"
                }
            };

            updateDatasetConsumer.run(message);
            scope.$apply();
            expect(datasetService.associateDataSetsToOrgUnit).toHaveBeenCalledWith([allDatasets[0], allDatasets[1]]);
        });
    });
});
