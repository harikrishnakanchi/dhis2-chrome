define(['downloadPivotTableConsumer', 'angularMocks', 'utils', 'pivotTableService', 'pivotTableRepository', 'userPreferenceRepository', 'datasetRepository'],
    function (DownloadPivotTableConsumer, mocks, utils, PivotTableService, PivotTableRepository, UserPreferenceRepository, DatasetRepository) {
        describe('Download PivotTables Consumer', function () {
            var downloadPivotTableConsumer, pivotTableService, pivotTableRepository, userPreferenceRepository, datasetRepository, scope, q;
            beforeEach(mocks.inject(function ($q, $rootScope) {
                scope = $rootScope;
                q = $q;

                pivotTableService = new PivotTableService();
                spyOn(pivotTableService, 'getAllTablesForDataset').and.returnValue(utils.getPromise(q, []));
                spyOn(pivotTableService, 'getPivotTableDataForOrgUnit').and.returnValue(utils.getPromise(q, []));

                pivotTableRepository = new PivotTableRepository();
                spyOn(pivotTableRepository, "upsert").and.returnValue(utils.getPromise(q, {}));
                spyOn(pivotTableRepository, "upsertPivotTableData").and.returnValue(utils.getPromise(q, {}));

                userPreferenceRepository = new UserPreferenceRepository();
                spyOn(userPreferenceRepository, 'getUserModules').and.returnValue(utils.getPromise(q, []));

                datasetRepository = new DatasetRepository();
                spyOn(datasetRepository, 'findAllForOrgUnits').and.returnValue(utils.getPromise(q, []));

                downloadPivotTableConsumer = new DownloadPivotTableConsumer(pivotTableService, pivotTableRepository, userPreferenceRepository, q, datasetRepository);
            }));

            it('should download all field app tables', function () {
                var fieldAppPivotTables = [{
                    "id": "table1",
                    "name": "Field App - Nutrition Monthly Pediatric",
                    "relativePeriods": {
                        "last12Months": false,
                        "last12Weeks": true
                    },
                    "indicators": [],
                    "dataElements": [{
                        "id": "de1",
                        "name": "New Admission - Emergency Department - Admission - General IPD Ward",
                        "code": "de1"
                    }]
                }];


                userPreferenceRepository.getUserModules.and.returnValue(utils.getPromise(q, [{"id": "mod1"}]));
                datasetRepository.findAllForOrgUnits.and.returnValue(utils.getPromise(q, [{"id": "ds1"}]));

                pivotTableService.getAllTablesForDataset.and.returnValue(utils.getPromise(q, fieldAppPivotTables));
                pivotTableService.getPivotTableDataForOrgUnit.and.returnValue(utils.getPromise(q, [{"id": "id12"}]));
                pivotTableRepository.upsert.and.returnValue(utils.getPromise(q, fieldAppPivotTables));

                downloadPivotTableConsumer.run();
                scope.$apply();

                expect(datasetRepository.findAllForOrgUnits).toHaveBeenCalledWith(["mod1"]);
                expect(pivotTableService.getAllTablesForDataset).toHaveBeenCalledWith([{id: 'ds1'}]);
                expect(pivotTableRepository.upsert).toHaveBeenCalledWith(fieldAppPivotTables);
                expect(pivotTableService.getPivotTableDataForOrgUnit).toHaveBeenCalledWith(fieldAppPivotTables[0], "mod1");
                expect(pivotTableRepository.upsertPivotTableData).toHaveBeenCalledWith('Field App - Nutrition Monthly Pediatric', 'mod1', [{id: 'id12'}]);
            });

            it('should exit if user module is empty', function () {
                downloadPivotTableConsumer.run();
                scope.$apply();

                expect(datasetRepository.findAllForOrgUnits).not.toHaveBeenCalled();
                expect(pivotTableService.getAllTablesForDataset).not.toHaveBeenCalled();
                expect(pivotTableRepository.upsert).not.toHaveBeenCalled();
                expect(pivotTableService.getPivotTableDataForOrgUnit).not.toHaveBeenCalled();
                expect(pivotTableRepository.upsertPivotTableData).not.toHaveBeenCalled();
            }); 
        });
    });