define(['downloadPivotTableDataConsumer', 'angularMocks', 'utils', 'moment', 'timecop', 'reportService', 'pivotTableRepository', 'userPreferenceRepository', 'datasetRepository', 'changeLogRepository', 'orgUnitRepository'],
    function(DownloadPivotTableDataConsumer, mocks, utils, moment, timecop, ReportService, PivotTableRepository, UserPreferenceRepository, DatasetRepository, ChangeLogRepository, OrgUnitRepository) {
        describe('Download Pivot Table Data Consumer', function() {
            var downloadPivotTableDataConsumer,
                reportService, pivotTableRepository, userPreferenceRepository, datasetRepository, changeLogRepository, orgUnitRepository,
                scope, q, currentTime, pivotTables, dataSets, mockModule;

            beforeEach(mocks.inject(function($q, $rootScope) {
                scope = $rootScope;
                q = $q;

                mockModule = {
                    'id': 'someModuleId'
                };

                var usersModules = [mockModule];

                dataSets = [{
                    id: 'mockDataSetId',
                    code: 'mockDataSetCode'
                }];

                pivotTables = [{
                    id: "mockTableId",
                    name: "[Field App - mockDataSetCode]"
                }];

                datasetRepository = new DatasetRepository();
                spyOn(datasetRepository, 'findAllForOrgUnits').and.returnValue(utils.getPromise(q, dataSets));

                userPreferenceRepository = new UserPreferenceRepository();
                spyOn(userPreferenceRepository, 'getCurrentUsersProjectIds').and.returnValue(utils.getPromise(q, []));
                spyOn(userPreferenceRepository, 'getCurrentUsersModules').and.returnValue(utils.getPromise(q, usersModules));
                spyOn(userPreferenceRepository, 'getCurrentUsersOriginOrgUnitIds').and.returnValue(utils.getPromise(q, {}));

                reportService = new ReportService();
                spyOn(reportService, 'getReportDataForOrgUnit').and.returnValue(utils.getPromise(q, {}));

                pivotTableRepository = new PivotTableRepository();
                spyOn(pivotTableRepository, 'getAll').and.returnValue(utils.getPromise(q, pivotTables));
                spyOn(pivotTableRepository, 'upsertPivotTableData').and.returnValue(utils.getPromise(q, {}));

                changeLogRepository = new ChangeLogRepository();
                spyOn(changeLogRepository, 'get').and.returnValue(utils.getPromise(q, null));
                spyOn(changeLogRepository, 'upsert').and.returnValue(utils.getPromise(q, {}));

                orgUnitRepository = new OrgUnitRepository();
                spyOn(orgUnitRepository, 'findAllByParent').and.returnValue(utils.getPromise(q, []));

                currentTime = moment('2016-02-29T02:03:00.000Z');
                Timecop.install();
                Timecop.freeze(currentTime.toISOString());

                downloadPivotTableDataConsumer = new DownloadPivotTableDataConsumer(reportService, pivotTableRepository, userPreferenceRepository, datasetRepository, changeLogRepository, orgUnitRepository, $q);
            }));

            afterEach(function() {
                Timecop.returnToPresent();
                Timecop.uninstall();
            });

            it('should download pivot table data for relevant modules and datasets', function() {
                var dataSet = {
                    id: 'dataSetId',
                    code: 'dataSetCode'
                }, pivotTableRelevantToDataSet = {
                    id: "mockTableId",
                    name: "[Field App - dataSetCode]"
                }, someOtherPivotTable = {
                    id: "mockTableId",
                    name: "[Field App - someOtherDataSetCode]"
                };

                datasetRepository.findAllForOrgUnits.and.returnValue(utils.getPromise(q, [dataSet]));
                pivotTableRepository.getAll.and.returnValue(utils.getPromise(q, [pivotTableRelevantToDataSet, someOtherPivotTable]));

                downloadPivotTableDataConsumer.run();
                scope.$apply();

                expect(reportService.getReportDataForOrgUnit).toHaveBeenCalledWith(pivotTableRelevantToDataSet, mockModule.id);
            });

            it('should upsert pivot Table data', function(){
                var pivotTableForDataSetA = {
                    id: "mockTableId",
                    name: "[Field App - mockDataSetCode]"
                }, mockPivotTableData = {
                    some: 'data'
                };

                reportService.getReportDataForOrgUnit.and.returnValue(utils.getPromise(q, mockPivotTableData));

                downloadPivotTableDataConsumer.run();
                scope.$apply();

                expect(pivotTableRepository.upsertPivotTableData).toHaveBeenCalledWith(pivotTableForDataSetA.name, mockModule.id, mockPivotTableData);
            });

            it('should retrieve dataSets for each module', function () {
                var mockModuleA = {
                    id:'mockModuleIdA'
                }, mockModuleB = {
                    id:'mockModuleIdB'
                };

                userPreferenceRepository.getCurrentUsersModules.and.returnValue(utils.getPromise(q, [mockModuleA, mockModuleB]));

                downloadPivotTableDataConsumer.run();
                scope.$apply();

                expect(datasetRepository.findAllForOrgUnits).toHaveBeenCalledWith([mockModuleA.id]);
                expect(datasetRepository.findAllForOrgUnits).toHaveBeenCalledWith([mockModuleB.id]);
            });

            it('should retrieve dataSets for both module and its origins', function() {
                var mockModule = {
                    'id': 'mockModuleId'
                }, mockOrigin = {
                    'id': 'mockOriginId'
                };
                userPreferenceRepository.getCurrentUsersModules.and.returnValue(utils.getPromise(q, [mockModule]));
                orgUnitRepository.findAllByParent.and.returnValue(utils.getPromise(q, [mockOrigin]));

                downloadPivotTableDataConsumer.run();
                scope.$apply();

                expect(orgUnitRepository.findAllByParent).toHaveBeenCalledWith([mockModule.id]);
                expect(datasetRepository.findAllForOrgUnits).toHaveBeenCalledWith([mockModule.id, mockOrigin.id]);
            });

            it('should retrieve then update the lastUpdated time in the changeLog', function () {
                var usersProjectIds = ['project1'];

                userPreferenceRepository.getCurrentUsersProjectIds.and.returnValue(utils.getPromise(q, usersProjectIds));

                downloadPivotTableDataConsumer.run();
                scope.$apply();

                expect(changeLogRepository.get).toHaveBeenCalledWith('pivotTableData:project1');
                expect(changeLogRepository.upsert).toHaveBeenCalledWith('pivotTableData:project1', currentTime.toISOString());
            });

            it('should continue downloading remaining pivot table data even if one call fails', function() {
                var userModules = [{
                    "id": "module1"
                }, {
                    "id": "module2"
                }, {
                    "id": "module3"
                }];

                userPreferenceRepository.getCurrentUsersModules.and.returnValue(utils.getPromise(q, userModules));
                reportService.getReportDataForOrgUnit.and.callFake(function(table, moduleId) {
                    if (table === pivotTables[0] && moduleId === "module1")
                        return utils.getPromise(q, "data1");
                    if (table === pivotTables[0] && moduleId === "module2")
                        return utils.getRejectedPromise(q, {});
                    if (table === pivotTables[0] && moduleId === "module3")
                        return utils.getPromise(q, "data3");
                });

                downloadPivotTableDataConsumer.run();
                scope.$apply();

                expect(reportService.getReportDataForOrgUnit).toHaveBeenCalledWith(pivotTables[0], "module1");
                expect(reportService.getReportDataForOrgUnit).toHaveBeenCalledWith(pivotTables[0], "module2");
                expect(reportService.getReportDataForOrgUnit).toHaveBeenCalledWith(pivotTables[0], "module3");
                expect(pivotTableRepository.upsertPivotTableData).toHaveBeenCalledWith(pivotTables[0].name, 'module1', "data1");
                expect(pivotTableRepository.upsertPivotTableData).not.toHaveBeenCalledWith(pivotTables[0].name, 'module2', "data2");
                expect(pivotTableRepository.upsertPivotTableData).toHaveBeenCalledWith(pivotTables[0].name, 'module3', "data3");
            });

            it('should not download pivot table data if user has no modules', function() {
                userPreferenceRepository.getCurrentUsersModules.and.returnValue(utils.getPromise(q, []));

                downloadPivotTableDataConsumer.run();
                scope.$apply();

                expect(reportService.getReportDataForOrgUnit).not.toHaveBeenCalled();
                expect(pivotTableRepository.upsertPivotTableData).not.toHaveBeenCalled();
            });

            it('should not download pivot table data if it has already been downloaded that same day', function() {
                changeLogRepository.get.and.returnValue(utils.getPromise(q, currentTime.subtract(1, 'hour').toISOString()));

                downloadPivotTableDataConsumer.run();
                scope.$apply();

                expect(reportService.getReportDataForOrgUnit).not.toHaveBeenCalled();
                expect(pivotTableRepository.upsertPivotTableData).not.toHaveBeenCalled();
            });
        });
    });
