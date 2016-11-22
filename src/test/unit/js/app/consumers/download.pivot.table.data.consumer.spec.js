define(['downloadPivotTableDataConsumer', 'angularMocks', 'utils', 'moment', 'timecop', 'reportService', 'pivotTableRepository', 'userPreferenceRepository', "dataSetRepository", 'changeLogRepository', 'orgUnitRepository', 'programRepository'],
    function(DownloadPivotTableDataConsumer, mocks, utils, moment, timecop, ReportService, PivotTableRepository, UserPreferenceRepository, DatasetRepository, ChangeLogRepository, OrgUnitRepository, ProgramRepository) {
        describe('Download Pivot Table Data Consumer', function() {
            var downloadPivotTableDataConsumer,
                reportService, pivotTableRepository, userPreferenceRepository, datasetRepository, changeLogRepository, orgUnitRepository, programRepository,
                scope, q, currentTime, mockProjectId, mockModule, mockDataSet, mockProgram, mockPivotTable;

            beforeEach(mocks.inject(function($q, $rootScope) {
                scope = $rootScope;
                q = $q;

                mockProjectId = 'mockProjectId';
                mockModule = {
                    'id': 'someModuleId'
                };

                mockDataSet = {
                    id: 'mockDataSetId',
                    serviceCode: 'mockDataSetServiceCode'
                };

                mockProgram = {
                    id: 'someProgramId',
                    serviceCode: 'someProgramServiceCode'
                };

                mockPivotTable = {
                    id: 'mockTableId',
                    name: 'someTableName',
                    serviceCode: mockDataSet.serviceCode,
                    weeklyReport: true
                };

                userPreferenceRepository = new UserPreferenceRepository();
                spyOn(userPreferenceRepository, 'getCurrentUsersProjectIds').and.returnValue(utils.getPromise(q, [mockProjectId]));

                orgUnitRepository = new OrgUnitRepository();
                spyOn(orgUnitRepository, 'findAllByParent').and.returnValue(utils.getPromise(q, []));
                spyOn(orgUnitRepository, 'getAllModulesInOrgUnits').and.returnValue(utils.getPromise(q, [mockModule]));

                datasetRepository = new DatasetRepository();
                spyOn(datasetRepository, 'findAllForOrgUnits').and.returnValue(utils.getPromise(q, [mockDataSet]));

                pivotTableRepository = new PivotTableRepository();
                spyOn(pivotTableRepository, 'getAll').and.returnValue(utils.getPromise(q, [mockPivotTable]));
                spyOn(pivotTableRepository, 'upsertPivotTableData').and.returnValue(utils.getPromise(q, {}));

                reportService = new ReportService();
                spyOn(reportService, 'getReportDataForOrgUnit').and.returnValue(utils.getPromise(q, {}));

                changeLogRepository = new ChangeLogRepository();
                spyOn(changeLogRepository, 'get').and.returnValue(utils.getPromise(q, null));
                spyOn(changeLogRepository, 'upsert').and.returnValue(utils.getPromise(q, {}));

                programRepository = new ProgramRepository();
                spyOn(programRepository, 'getProgramForOrgUnit').and.returnValue(utils.getPromise(q, mockProgram));

                currentTime = moment('2016-02-29T02:03:00.000Z');
                Timecop.install();
                Timecop.freeze(currentTime.toISOString());

                downloadPivotTableDataConsumer = new DownloadPivotTableDataConsumer(reportService, pivotTableRepository, userPreferenceRepository, datasetRepository, changeLogRepository, orgUnitRepository, programRepository, $q);
            }));

            afterEach(function() {
                Timecop.returnToPresent();
                Timecop.uninstall();
            });

            it('should download pivot table data for relevant modules and datasets', function() {
                var pivotTableRelevantToDataSet = {
                    id: 'mockTableId',
                    name: 'mockTableName',
                    serviceCode: mockDataSet.serviceCode,
                    weeklyReport: true
                }, someOtherPivotTable = {
                    id: 'mockTableId',
                    name: 'mockTableName',
                    serviceCode: 'someOtherDataSetServiceCode',
                    weeklyReport: true
                };

                pivotTableRepository.getAll.and.returnValue(utils.getPromise(q, [pivotTableRelevantToDataSet, someOtherPivotTable]));

                downloadPivotTableDataConsumer.run();
                scope.$apply();

                expect(reportService.getReportDataForOrgUnit).toHaveBeenCalledWith(pivotTableRelevantToDataSet, mockModule.id);
                expect(reportService.getReportDataForOrgUnit).not.toHaveBeenCalledWith(someOtherPivotTable, mockModule.id);
            });

            it('should download pivot table data for relevant program associated to module', function () {
                var pivotTableForAssosciatedProgram = {
                    id: 'mockTableId',
                    serviceCode: mockProgram.serviceCode
                }, someOtherPivotTable = {
                    id: 'someOtherTableId',
                    serviceCode: 'someOtherServiceCode'
                };

                pivotTableRepository.getAll.and.returnValue(utils.getPromise(q, [pivotTableForAssosciatedProgram, someOtherPivotTable]));

                downloadPivotTableDataConsumer.run();
                scope.$apply();

                expect(reportService.getReportDataForOrgUnit).toHaveBeenCalledWith(pivotTableForAssosciatedProgram, mockModule.id);
                expect(reportService.getReportDataForOrgUnit).not.toHaveBeenCalledWith(someOtherPivotTable, mockModule.id);
            });

            it('should upsert pivot Table data', function(){
                var mockPivotTableData = {
                    some: 'data'
                };

                reportService.getReportDataForOrgUnit.and.returnValue(utils.getPromise(q, mockPivotTableData));

                downloadPivotTableDataConsumer.run();
                scope.$apply();

                expect(pivotTableRepository.upsertPivotTableData).toHaveBeenCalledWith(mockPivotTable.id, mockModule.id, mockPivotTableData);
            });

            it('should retrieve modules for each project', function () {
                var mockProjectIds = ['mockProjectIdA', 'mockProjectIdB'];

                userPreferenceRepository.getCurrentUsersProjectIds.and.returnValues(utils.getPromise(q, mockProjectIds));

                downloadPivotTableDataConsumer.run();
                scope.$apply();

                expect(orgUnitRepository.getAllModulesInOrgUnits).toHaveBeenCalledWith(['mockProjectIdB']);
                expect(orgUnitRepository.getAllModulesInOrgUnits).toHaveBeenCalledWith(['mockProjectIdA']);
            });

            it('should retrieve dataSets for each module', function () {
                var mockModuleA = {
                    id:'mockModuleIdA'
                }, mockModuleB = {
                    id:'mockModuleIdB'
                };

                orgUnitRepository.getAllModulesInOrgUnits.and.returnValue(utils.getPromise(q, [mockModuleA, mockModuleB]));

                downloadPivotTableDataConsumer.run();
                scope.$apply();

                expect(datasetRepository.findAllForOrgUnits).toHaveBeenCalledWith([mockModuleA]);
                expect(datasetRepository.findAllForOrgUnits).toHaveBeenCalledWith([mockModuleB]);
            });

            it('should retrieve programs for each module', function () {
                var mockOrigin = { id: 'someMockOrigin' };

                orgUnitRepository.findAllByParent.and.returnValue(utils.getPromise(q, [mockOrigin]));

                downloadPivotTableDataConsumer.run();
                scope.$apply();
                expect(programRepository.getProgramForOrgUnit).toHaveBeenCalledWith(mockOrigin.id);
            });

            it('should retrieve dataSets for both module and its origins', function() {
                var mockOrigin = {
                    'id': 'mockOriginId'
                };
                orgUnitRepository.findAllByParent.and.returnValue(utils.getPromise(q, [mockOrigin]));

                downloadPivotTableDataConsumer.run();
                scope.$apply();

                expect(orgUnitRepository.findAllByParent).toHaveBeenCalledWith(mockModule.id);
                expect(datasetRepository.findAllForOrgUnits).toHaveBeenCalledWith([mockModule, mockOrigin]);
            });

            it('should download pivot table data using origin orgUnits for geographicOriginReports', function () {
                var mockOrigin = {
                    'id': 'mockOriginId'
                };
                var geographicOriginPivotTable = {
                    id: 'mockTableId',
                    name: 'mockTableName',
                    serviceCode: mockDataSet.serviceCode,
                    weeklyReport: true,
                    geographicOriginReport: true
                };
                orgUnitRepository.findAllByParent.and.returnValue(utils.getPromise(q, [mockOrigin]));
                pivotTableRepository.getAll.and.returnValue(utils.getPromise(q, [geographicOriginPivotTable]));

                downloadPivotTableDataConsumer.run();
                scope.$apply();

                expect(reportService.getReportDataForOrgUnit).toHaveBeenCalledWith(geographicOriginPivotTable, [mockOrigin.id]);
            });

            it('should retrieve the lastUpdated time in the changeLog', function () {
                downloadPivotTableDataConsumer.run();
                scope.$apply();

                expect(changeLogRepository.get).toHaveBeenCalledWith('weeklyPivotTableData:' + mockProjectId);
                expect(changeLogRepository.get).toHaveBeenCalledWith('monthlyPivotTableData:' + mockProjectId);
            });

            it('should update the lastUpdated time in the changeLog', function () {
                downloadPivotTableDataConsumer.run();
                scope.$apply();

                expect(changeLogRepository.upsert).toHaveBeenCalledWith('weeklyPivotTableData:' + mockProjectId, currentTime.toISOString());
                expect(changeLogRepository.upsert).toHaveBeenCalledWith('monthlyPivotTableData:' + mockProjectId, currentTime.toISOString());
            });

            it('should continue downloading remaining pivot table data even if one call fails', function() {
                var userModules = [{
                    "id": "module1"
                }, {
                    "id": "module2"
                }, {
                    "id": "module3"
                }];

                orgUnitRepository.getAllModulesInOrgUnits.and.returnValue(utils.getPromise(q, userModules));
                reportService.getReportDataForOrgUnit.and.callFake(function(table, moduleId) {
                    if (table === mockPivotTable && moduleId === "module1")
                        return utils.getPromise(q, "data1");
                    if (table === mockPivotTable && moduleId === "module2")
                        return utils.getRejectedPromise(q, {});
                    if (table === mockPivotTable && moduleId === "module3")
                        return utils.getPromise(q, "data3");
                });

                downloadPivotTableDataConsumer.run();
                scope.$apply();

                expect(pivotTableRepository.upsertPivotTableData).toHaveBeenCalledWith(mockPivotTable.id, 'module1', "data1");
                expect(pivotTableRepository.upsertPivotTableData).not.toHaveBeenCalledWith(mockPivotTable.id, 'module2', "data2");
                expect(pivotTableRepository.upsertPivotTableData).toHaveBeenCalledWith(mockPivotTable.id, 'module3', "data3");
                expect(changeLogRepository.upsert).not.toHaveBeenCalled();
            });

            it('should not download pivot table data if user has no modules', function() {
                orgUnitRepository.getAllModulesInOrgUnits.and.returnValue(utils.getPromise(q, []));

                downloadPivotTableDataConsumer.run();
                scope.$apply();

                expect(reportService.getReportDataForOrgUnit).not.toHaveBeenCalled();
            });

            it('should not download weekly pivot table data if it has already been downloaded that same day', function() {
                var mockWeeklyPivotTable = {
                    id: 'someId',
                    weeklyReport: true,
                    serviceCode: mockDataSet.serviceCode
                };

                pivotTableRepository.getAll.and.returnValue(utils.getPromise(q, [mockWeeklyPivotTable]));
                changeLogRepository.get.and.returnValue(utils.getPromise(q, moment(currentTime).subtract(1, 'hour').toISOString()));

                downloadPivotTableDataConsumer.run();
                scope.$apply();

                expect(reportService.getReportDataForOrgUnit).not.toHaveBeenCalled();
                expect(changeLogRepository.upsert).not.toHaveBeenCalledWith('weeklyPivotTableData:' + mockProjectId, currentTime.toISOString());
            });

            it('should not download monthly pivot table data if it has already been downloaded in the same day', function () {
                var mockMonthlyPivotTable = {
                    id: 'someId',
                    monthlyReport: true,
                    serviceCode: mockDataSet.serviceCode
                };

                var lastDownlaodedTime =  moment('2016-02-27T01:03:00.000Z').toISOString();
                currentTime = moment('2016-02-27T02:03:00.000Z');
                Timecop.freeze(currentTime.toISOString());

                pivotTableRepository.getAll.and.returnValue(utils.getPromise(q, [mockMonthlyPivotTable]));
                changeLogRepository.get.and.returnValue(utils.getPromise(q, lastDownlaodedTime));

                downloadPivotTableDataConsumer.run();
                scope.$apply();

                expect(reportService.getReportDataForOrgUnit).not.toHaveBeenCalled();
                expect(changeLogRepository.upsert).not.toHaveBeenCalledWith('monthlyPivotTableData:' + mockProjectId, currentTime.toISOString());
            });

            it('should download monthly pivot table if it has not been downloaded in the same day', function() {
                var mockMonthlyPivotTable = {
                    id: 'someId',
                    monthlyReport: true,
                    serviceCode: mockDataSet.serviceCode
                };

                var lastDownloadedTime = moment('2016-02-27T02:03:00.000Z').toISOString();
                currentTime = moment('2016-02-28T02:03:00.000Z');
                Timecop.freeze(currentTime.toISOString());

                pivotTableRepository.getAll.and.returnValue(utils.getPromise(q, [mockMonthlyPivotTable]));
                changeLogRepository.get.and.returnValue(utils.getPromise(q, lastDownloadedTime));

                downloadPivotTableDataConsumer.run();
                scope.$apply();

                expect(reportService.getReportDataForOrgUnit).toHaveBeenCalled();
                expect(changeLogRepository.upsert).toHaveBeenCalledWith('monthlyPivotTableData:' + mockProjectId, currentTime.toISOString());
            });

            it('should download project report for a project', function () {
                var mockProjectReport = {
                    projectReport: true
                };

                pivotTableRepository.getAll.and.returnValue(utils.getPromise(q, [mockProjectReport]));

                downloadPivotTableDataConsumer.run();
                scope.$apply();

                expect(reportService.getReportDataForOrgUnit).toHaveBeenCalledWith(mockProjectReport, mockProjectId);
            });
        });
    });
