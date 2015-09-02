define(['downloadPivotTableConsumer', 'angularMocks', 'utils'], function(DownloadPivotTableConsumer, mocks, utils) {
    describe('Download PivotTables Consumer', function() {
        var downloadPivotTableConsumer, pivotTableService, pivotTableRepository, scope, q, userPreferenceRepository;
        beforeEach(mocks.inject(function($q, $rootScope) {
            scope = $rootScope;
            q = $q;
            pivotTableService = jasmine.createSpyObj('pivotTableService', ['getAllTablesForDataset']);
            pivotTableRepository = {
                'upsert': jasmine.createSpy("upsert").and.returnValue(utils.getPromise(q, {})),
            };
            pivotTableService = {
                'getAllTablesForDataset': jasmine.createSpy("getAllTablesForDataset").and.returnValue(utils.getPromise(q, {})),
            };
            userPreferenceRepository = jasmine.createSpyObj('userPreferenceRepository', ['getUserModules']);
            userPreferenceRepository.getUserModules.and.returnValue(utils.getPromise(q, {}));
            datasetRepository = jasmine.createSpyObj('datasetRepository', ['findAllForOrgUnits']);
            downloadPivotTableConsumer = new DownloadPivotTableConsumer(pivotTableService, pivotTableRepository, userPreferenceRepository, q, datasetRepository);

        }));

        it('should download all field app tables', function() {


            var fieldAppPivotTables = [{
                "id": "table1",
                "name": "Field App - Nutrition Monthly Pediatric",
                "relativePeriods": {
                    "last12Months": false,
                    "last12Weeks": true,
                },
                "indicators": [],
                "dataElements": [{
                    "id": "de1",
                    "name": "New Admission - Emergency Department - Admission - General IPD Ward",
                    "code": "de1",
                }]
            }, {
                "id": "table2",
                "name": "Field App - Nutrition Monthly General",
                "relativePeriods": {
                    "last12Months": true,
                    "last12Weeks": false,
                },
                "indicators": [],
                "dataElements": [{
                    "id": "de2",
                    "name": "New Consultations - Consultations - Out Patient Department - General",
                    "code": "de2",
                }]
            }];


            pivotTableService.getAllTablesForDataset.and.returnValue(utils.getPromise(q, fieldAppPivotTables));
            pivotTableRepository.upsert.and.returnValue(utils.getPromise(q, fieldAppPivotTables));

            downloadPivotTableConsumer.run();
            scope.$apply();

            expect(pivotTableService.getAllTablesForDataset).toHaveBeenCalled();
            expect(pivotTableRepository.upsert).toHaveBeenCalledWith(fieldAppPivotTables);
        });

    });
});