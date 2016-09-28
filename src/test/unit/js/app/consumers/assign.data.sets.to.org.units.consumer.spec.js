define(['assignDataSetsToOrgUnitsConsumer', 'utils', 'angularMocks', 'orgUnitService'], function(AssignDataSetsToOrgUnitsConsumer, utils, mocks, OrgUnitService) {
    describe('assignDataSetsToOrgUnitsConsumer', function() {
        var assignDataSetsToOrgUnitsConsumer, message, orgUnitService, q, scope;

        beforeEach(mocks.inject(function($q, $rootScope) {
            q = $q;
            scope = $rootScope.$new();

            orgUnitService = new OrgUnitService();
            spyOn(orgUnitService, 'assignDataSetToOrgUnit').and.returnValue(utils.getPromise(q, {}));

            assignDataSetsToOrgUnitsConsumer = new AssignDataSetsToOrgUnitsConsumer(orgUnitService, q);
        }));

        it('should assign each dataSet to each orgUnit', function() {
            message = {
                data: {
                    data: {
                        orgUnitIds: ['orgUnit1', 'orgUnit2'],
                        dataSetIds: ['dataSetA', 'dataSetB']
                    },
                    type: 'associateDataset'
                }
            };

            assignDataSetsToOrgUnitsConsumer.run(message);
            scope.$apply();

            expect(orgUnitService.assignDataSetToOrgUnit).toHaveBeenCalledWith('orgUnit1', 'dataSetA');
            expect(orgUnitService.assignDataSetToOrgUnit).toHaveBeenCalledWith('orgUnit2', 'dataSetA');
            expect(orgUnitService.assignDataSetToOrgUnit).toHaveBeenCalledWith('orgUnit1', 'dataSetB');
            expect(orgUnitService.assignDataSetToOrgUnit).toHaveBeenCalledWith('orgUnit2', 'dataSetB');
        });
    });
});
