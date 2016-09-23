define(["removeOrgunitDatasetAssociationConsumer", "utils", "angularMocks", "datasetService"], function(RemoveOrgunitDatasetAssociationConsumer, utils, mocks, DatasetService) {
    describe("removeOrgunitDatasetAssociationConsumer", function() {
        var removeOrgunitDatasetAssociationConsumer, message, datasetService, q, scope;

        beforeEach(mocks.inject(function($q, $rootScope) {
            q = $q;
            scope = $rootScope.$new();

            datasetService = new DatasetService();
            spyOn(datasetService, "removeOrgUnitFromDataset").and.returnValue(utils.getPromise(q, {}));

            removeOrgunitDatasetAssociationConsumer = new RemoveOrgunitDatasetAssociationConsumer(datasetService, q);
        }));

        it("should remove each orgUnit from each dataset", function() {
            message = {
                data: {
                    data: {
                        orgUnitIds: ['orgUnit1', 'orgUnit2'],
                        dataSetIds: ['dataSetA', 'dataSetB']
                    },
                }
            };

            removeOrgunitDatasetAssociationConsumer.run(message);
            scope.$apply();

            expect(datasetService.removeOrgUnitFromDataset).toHaveBeenCalledWith('dataSetA', 'orgUnit1');
            expect(datasetService.removeOrgUnitFromDataset).toHaveBeenCalledWith('dataSetA', 'orgUnit2');
            expect(datasetService.removeOrgUnitFromDataset).toHaveBeenCalledWith('dataSetB', 'orgUnit1');
            expect(datasetService.removeOrgUnitFromDataset).toHaveBeenCalledWith('dataSetB', 'orgUnit2');
        });
    });
});

