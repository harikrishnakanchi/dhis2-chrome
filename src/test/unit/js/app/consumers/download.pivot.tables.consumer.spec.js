define(['downloadPivotTablesConsumer', 'angularMocks', 'utils', 'timecop', 'reportService', 'pivotTableRepository', 'userPreferenceRepository', 'datasetRepository', 'changeLogRepository'],
    function(DownloadPivotTablesConsumer, mocks, utils, timecop, ReportService, PivotTableRepository, UserPreferenceRepository, DatasetRepository, ChangeLogRepository) {

        describe('Download Pivot Tables Consumer', function() {
            var downloadPivotTablesConsumer, reportService, userPreferenceRepository, datasetRepository, changeLogRepository, scope, q;

            beforeEach(mocks.inject(function($q, $rootScope) {

                scope = $rootScope;
                q = $q;

                datasetRepository = new DatasetRepository();
                spyOn(datasetRepository, 'findAllForOrgUnits').and.returnValue(utils.getPromise(q, {}));

                userPreferenceRepository = new UserPreferenceRepository();
                spyOn(userPreferenceRepository, 'getCurrentProjects').and.returnValue(utils.getPromise(q, []));
                spyOn(userPreferenceRepository, 'getUserModules').and.returnValue(utils.getPromise(q, {}));
                spyOn(userPreferenceRepository, 'getOriginOrgUnitIds').and.returnValue(utils.getPromise(q, {}));

                reportService = new ReportService();
                spyOn(reportService, 'getPivotTables').and.returnValue(utils.getPromise(q, {}));
                spyOn(reportService, 'getReportDataForOrgUnit').and.returnValue(utils.getPromise(q, {}));

                pivotTableRepository = new PivotTableRepository();
                spyOn(pivotTableRepository, 'replaceAll').and.returnValue(utils.getPromise(q, {}));
                spyOn(pivotTableRepository, 'upsertPivotTableData').and.returnValue(utils.getPromise(q, {}));

                changeLogRepository = new ChangeLogRepository();
                spyOn(changeLogRepository, 'get').and.returnValue(utils.getPromise(q, '2014-09-30T11:00:00.000Z'));
                spyOn(changeLogRepository, 'clear').and.returnValue(utils.getPromise(q, {}));
                spyOn(changeLogRepository, 'upsert').and.returnValue(utils.getPromise(q, {}));

                Timecop.install();
                Timecop.freeze(new Date('2014-10-01T12:00:00.000Z'));

                downloadPivotTablesConsumer = new DownloadPivotTablesConsumer(reportService, pivotTableRepository, userPreferenceRepository, datasetRepository, changeLogRepository, $q);
            }));

            afterEach(function() {
                Timecop.returnToPresent();
                Timecop.uninstall();
            });

            it('should download all field app tables', function() {
                var fieldAppPivotTables = [{
                    "id": "table1",
                    "name": "Field App - Nutrition Monthly Pediatric",
                    "someAttribute": "someValue"
                }];

                var dataSets = [{
                    "id": "ds1",
                    "code": "Nutrition Monthly Pediatric"
                }];

                userPreferenceRepository.getUserModules.and.returnValue(utils.getPromise(q, [{
                    "id": "mod1"
                }]));
                datasetRepository.findAllForOrgUnits.and.returnValue(utils.getPromise(q, dataSets));

                reportService.getPivotTables.and.returnValue(utils.getPromise(q, fieldAppPivotTables));
                reportService.getReportDataForOrgUnit.and.returnValue(utils.getPromise(q, [{
                    "id": "id12"
                }]));
                pivotTableRepository.replaceAll.and.returnValue(utils.getPromise(q, fieldAppPivotTables));

                downloadPivotTablesConsumer.run();
                scope.$apply();

                expect(datasetRepository.findAllForOrgUnits).toHaveBeenCalledWith(["mod1"]);
                expect(reportService.getPivotTables).toHaveBeenCalledWith(dataSets);
                expect(pivotTableRepository.replaceAll).toHaveBeenCalledWith(fieldAppPivotTables);
                expect(reportService.getReportDataForOrgUnit).toHaveBeenCalledWith(fieldAppPivotTables[0], "mod1");
                expect(pivotTableRepository.upsertPivotTableData).toHaveBeenCalledWith('Field App - Nutrition Monthly Pediatric', 'mod1', [{
                    id: 'id12'
                }]);
            });

            it('should continue download of all field app tables even if one call fails', function() {
                var fieldAppPivotTables = [{
                    "id": "table1",
                    "name": "Field App - Nutrition Monthly Pediatric",
                    "someAttribute": "someValue"
                }];

                var userModules = [{
                    "id": "mod1"
                }, {
                    "id": "mod2"
                }, {
                    "id": "mod3"
                }];

                var dataSets = [{
                    "id": "ds1",
                    "code": "Nutrition Monthly Pediatric"
                }];

                userPreferenceRepository.getUserModules.and.returnValue(utils.getPromise(q, userModules));
                datasetRepository.findAllForOrgUnits.and.returnValue(utils.getPromise(q, dataSets));

                reportService.getPivotTables.and.returnValue(utils.getPromise(q, fieldAppPivotTables));
                reportService.getReportDataForOrgUnit.and.callFake(function(table, modId) {
                    if (table === fieldAppPivotTables[0] && modId === "mod1")
                        return utils.getPromise(q, "data1");
                    if (table === fieldAppPivotTables[0] && modId === "mod2")
                        return utils.getRejectedPromise(q, {});
                    if (table === fieldAppPivotTables[0] && modId === "mod3")
                        return utils.getPromise(q, "data3");
                });

                pivotTableRepository.replaceAll.and.returnValue(utils.getPromise(q, fieldAppPivotTables));

                downloadPivotTablesConsumer.run();
                scope.$apply();

                expect(datasetRepository.findAllForOrgUnits).toHaveBeenCalledWith(["mod1", "mod2", "mod3"]);
                expect(reportService.getPivotTables).toHaveBeenCalledWith(dataSets);
                expect(pivotTableRepository.replaceAll).toHaveBeenCalledWith(fieldAppPivotTables);
                expect(reportService.getReportDataForOrgUnit).toHaveBeenCalledWith(fieldAppPivotTables[0], "mod1");
                expect(reportService.getReportDataForOrgUnit).toHaveBeenCalledWith(fieldAppPivotTables[0], "mod2");
                expect(reportService.getReportDataForOrgUnit).toHaveBeenCalledWith(fieldAppPivotTables[0], "mod3");
                expect(pivotTableRepository.upsertPivotTableData).toHaveBeenCalledWith('Field App - Nutrition Monthly Pediatric', 'mod1', "data1");
                expect(pivotTableRepository.upsertPivotTableData).not.toHaveBeenCalledWith('Field App - Nutrition Monthly Pediatric', 'mod2', "data2");
                expect(pivotTableRepository.upsertPivotTableData).toHaveBeenCalledWith('Field App - Nutrition Monthly Pediatric', 'mod3', "data3");
            });

            it('should exit if user module is empty', function() {
                downloadPivotTablesConsumer.run();
                scope.$apply();

                expect(userPreferenceRepository.getUserModules).toHaveBeenCalled();
                expect(datasetRepository.findAllForOrgUnits).not.toHaveBeenCalled();
                expect(reportService.getReportDataForOrgUnit).not.toHaveBeenCalled();
                expect(pivotTableRepository.replaceAll).not.toHaveBeenCalled();
                expect(pivotTableRepository.upsertPivotTableData).not.toHaveBeenCalled();
            });

            it('should exit if reports had already been downloaded for the day', function() {
                changeLogRepository.get.and.returnValue(utils.getPromise(q, '2014-10-01T05:00:00.000Z'));

                downloadPivotTablesConsumer.run();
                scope.$apply();

                expect(userPreferenceRepository.getUserModules).toHaveBeenCalled();
                expect(datasetRepository.findAllForOrgUnits).not.toHaveBeenCalled();
                expect(reportService.getReportDataForOrgUnit).not.toHaveBeenCalled();
                expect(pivotTableRepository.replaceAll).not.toHaveBeenCalled();
                expect(pivotTableRepository.upsertPivotTableData).not.toHaveBeenCalled();
            });

        });
    });
