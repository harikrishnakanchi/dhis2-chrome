define(['downloadChartDataConsumer', 'angularMocks', 'utils', 'timecop', 'moment', 'reportService', 'systemInfoService', 'chartRepository', 'userPreferenceRepository', "dataSetRepository", 'changeLogRepository', 'orgUnitRepository', 'programRepository'],
    function(DownloadChartDataConsumer, mocks, utils, timecop, moment, ReportService, SystemInfoService, ChartRepository, UserPreferenceRepository, DatasetRepository, ChangeLogRepository, OrgUnitRepository, ProgramRepository) {

        describe('Download Chart Data Consumer', function() {
            var downloadChartDataConsumer,
                reportService, systemInfoService, chartRepository, userPreferenceRepository, datasetRepository, changeLogRepository, orgUnitRepository, programRepository,
                scope, q, currentTime, mockProjectId, mockModule, mockProgram, mockDataSet, mockChart;

            beforeEach(mocks.inject(function($q, $rootScope) {
                scope = $rootScope;
                q = $q;

                mockProjectId = 'someProjectId';
                mockModule = {
                    id: 'someModuleId'
                };
                mockDataSet = {
                    id: 'someDataSetId',
                    serviceCode: 'someDataSetServiceCode'
                };
                mockProgram = {
                    id: 'someProgramId',
                    serviceCode: 'someProgramServiceCode'
                };
                mockChart = {
                    id: 'someChartId',
                    serviceCode: mockDataSet.serviceCode
                };

                datasetRepository = new DatasetRepository();
                spyOn(datasetRepository, 'findAllForOrgUnits').and.returnValue(utils.getPromise(q, [mockDataSet]));

                userPreferenceRepository = new UserPreferenceRepository();
                spyOn(userPreferenceRepository, 'getCurrentUsersProjectIds').and.returnValue(utils.getPromise(q, [mockProjectId]));

                orgUnitRepository = new OrgUnitRepository();
                spyOn(orgUnitRepository, 'findAllByParent').and.returnValue(utils.getPromise(q, []));
                spyOn(orgUnitRepository, 'getAllModulesInOrgUnits').and.returnValue(utils.getPromise(q, [mockModule]));

                chartRepository = new ChartRepository();
                spyOn(chartRepository, 'getAll').and.returnValue(utils.getPromise(q, [mockChart]));
                spyOn(chartRepository, 'upsertChartData').and.returnValue(utils.getPromise(q, {}));

                reportService = new ReportService();
                spyOn(reportService, 'getReportDataForOrgUnit').and.returnValue(utils.getPromise(q, {}));

                systemInfoService = new SystemInfoService();
                spyOn(systemInfoService, 'getServerDate');

                changeLogRepository = new ChangeLogRepository();
                spyOn(changeLogRepository, 'get').and.returnValue(utils.getPromise(q, null));
                spyOn(changeLogRepository, 'upsert').and.returnValue(utils.getPromise(q, {}));

                programRepository = new ProgramRepository();
                spyOn(programRepository, 'getProgramForOrgUnit').and.returnValue(utils.getPromise(q, mockProgram));

                currentTime = moment('2014-10-01T12:00:00.000Z');
                Timecop.install();
                Timecop.freeze(currentTime.toISOString());

                downloadChartDataConsumer = new DownloadChartDataConsumer(reportService, systemInfoService, chartRepository, userPreferenceRepository, datasetRepository, changeLogRepository, orgUnitRepository, programRepository, $q);
            }));

            afterEach(function() {
                Timecop.returnToPresent();
                Timecop.uninstall();
            });

            it('should retrieve the modules for each project', function() {
                var mockProjectIds = ['projectIdA', 'projectIdB'];
                userPreferenceRepository.getCurrentUsersProjectIds.and.returnValue(utils.getPromise(q, mockProjectIds));

                downloadChartDataConsumer.run();
                scope.$apply();

                expect(orgUnitRepository.getAllModulesInOrgUnits).toHaveBeenCalledWith(['projectIdA']);
                expect(orgUnitRepository.getAllModulesInOrgUnits).toHaveBeenCalledWith(['projectIdB']);
            });

            it('should retrieve the lastUpdated time from the changeLog for each of the module', function() {
                downloadChartDataConsumer.run();
                scope.$apply();

                expect(changeLogRepository.get).toHaveBeenCalledWith('weeklyChartData:' + mockProjectId + ':' + mockModule.id);
                expect(changeLogRepository.get).toHaveBeenCalledWith('monthlyChartData:' + mockProjectId + ':' + mockModule.id);
                expect(changeLogRepository.get).toHaveBeenCalledWith('yearlyChartData:' + mockProjectId + ':' + mockModule.id);
            });

            it('should update the lastUpdated with the system time in the changeLog', function() {
                var systemTime = 'someTime';
                systemInfoService.getServerDate.and.returnValue(utils.getPromise(q, systemTime));
                downloadChartDataConsumer.run();
                scope.$apply();

                expect(changeLogRepository.upsert).toHaveBeenCalledWith('weeklyChartData:' + mockProjectId + ':' + mockModule.id, systemTime);
                expect(changeLogRepository.upsert).toHaveBeenCalledWith('monthlyChartData:' + mockProjectId + ':' + mockModule.id, systemTime);
                expect(changeLogRepository.upsert).toHaveBeenCalledWith('yearlyChartData:' + mockProjectId + ':' + mockModule.id, systemTime);
            });

            it('should retrieve dataSets for each module', function() {
                var mockModuleA = {
                    id: 'mockModuleIdA'
                }, mockModuleB = {
                    id: 'mockModuleIdB'
                };
                orgUnitRepository.getAllModulesInOrgUnits.and.returnValue(utils.getPromise(q, [mockModuleA, mockModuleB]));

                downloadChartDataConsumer.run();
                scope.$apply();

                expect(datasetRepository.findAllForOrgUnits).toHaveBeenCalledWith([mockModuleA]);
                expect(datasetRepository.findAllForOrgUnits).toHaveBeenCalledWith([mockModuleB]);
            });

            it('should retrieve dataSets for module and its origins', function() {
                var mockOrigin = {
                    id: 'mockOriginId'
                };

                orgUnitRepository.findAllByParent.and.returnValue(utils.getPromise(q, [mockOrigin]));
                downloadChartDataConsumer.run();
                scope.$apply();

                expect(datasetRepository.findAllForOrgUnits).toHaveBeenCalledWith([mockModule, mockOrigin]);
            });

            it('should retrieve programs for each module', function () {
                var mockOrigin = { id: 'someMockOrigin' };

                orgUnitRepository.findAllByParent.and.returnValue(utils.getPromise(q, [mockOrigin]));

                downloadChartDataConsumer.run();
                scope.$apply();
                expect(programRepository.getProgramForOrgUnit).toHaveBeenCalledWith(mockOrigin.id);
            });

            it('should save chart data to the database', function() {
                var mockChartData = {
                    some: 'data'
                };

                reportService.getReportDataForOrgUnit.and.returnValue(utils.getPromise(q, mockChartData));

                downloadChartDataConsumer.run();
                scope.$apply();

                expect(chartRepository.upsertChartData).toHaveBeenCalledWith(mockChart.id, mockModule.id, mockChartData);
                });

            it('should download chart data for relevant modules and datasets', function() {
                var chartRelevantToDataSet = {
                    id: 'mockChartId',
                    serviceCode: mockDataSet.serviceCode
                }, someOtherChart = {
                    id: 'mockChartId',
                    serviceCode: 'someOtherDataSetServiceCode'
                };
                chartRepository.getAll.and.returnValue(utils.getPromise(q, [chartRelevantToDataSet, someOtherChart]));

                downloadChartDataConsumer.run();
                scope.$apply();

                expect(reportService.getReportDataForOrgUnit).toHaveBeenCalledWith(chartRelevantToDataSet, mockModule.id);
                expect(reportService.getReportDataForOrgUnit).not.toHaveBeenCalledWith(someOtherChart, mockModule.id);
            });

            it('should download chart data for relevant program associated to module', function () {
                var chartForAssosciatedProgram = {
                    id: 'mockChartId',
                    serviceCode: mockProgram.serviceCode
                }, someOtherChartTable = {
                    id: 'someOtherChartId',
                    serviceCode: 'someOtherDataSetServiceCode'
                };

                chartRepository.getAll.and.returnValue(utils.getPromise(q, [chartForAssosciatedProgram, someOtherChartTable]));

                downloadChartDataConsumer.run();
                scope.$apply();

                expect(reportService.getReportDataForOrgUnit).toHaveBeenCalledWith(chartForAssosciatedProgram, mockModule.id);
                expect(reportService.getReportDataForOrgUnit).not.toHaveBeenCalledWith(someOtherChartTable, mockModule.id);
            });

            it('should download chart data for origins for geographicOriginCharts', function() {
                var geographicOriginChart = {
                    id: 'mockChartId',
                    serviceCode: mockDataSet.serviceCode,
                    geographicOriginChart: true
                },  mockOrigin = {
                    id: 'someOriginId'
                };
                chartRepository.getAll.and.returnValue(utils.getPromise(q, [geographicOriginChart]));
                orgUnitRepository.findAllByParent.and.returnValue(utils.getPromise(q, [mockOrigin]));

                downloadChartDataConsumer.run();
                scope.$apply();

                expect(reportService.getReportDataForOrgUnit).toHaveBeenCalledWith(geographicOriginChart, [mockOrigin.id]);
            });

            it('should continue download of charts even if one call fails', function() {
                var usersModules = [{
                    id: 'Mod1'
                }, {
                    id: 'Mod2'
                }, {
                    id: 'Mod3'
                }];

                orgUnitRepository.getAllModulesInOrgUnits.and.returnValue(utils.getPromise(q, usersModules));
                reportService.getReportDataForOrgUnit.and.callFake(function(chart, moduleId) {
                    if (moduleId === 'Mod1')
                        return utils.getPromise(q, 'data1');
                    if (moduleId === 'Mod2')
                        return utils.getRejectedPromise(q, {});
                    if (moduleId === 'Mod3')
                        return utils.getPromise(q, 'data3');
                });

                downloadChartDataConsumer.run();
                scope.$apply();

                expect(chartRepository.upsertChartData).toHaveBeenCalledWith(mockChart.id, 'Mod1', 'data1');
                expect(chartRepository.upsertChartData).not.toHaveBeenCalledWith(mockChart.id, 'Mod2', 'data2');
                expect(chartRepository.upsertChartData).toHaveBeenCalledWith(mockChart.id, 'Mod3', 'data3');
            });

            it('should not continue download of charts if a call fails because of loss of network connectivity', function() {
                var usersModules = [{
                    id: 'Mod1'
                }, {
                    id: 'Mod2'
                }];

                orgUnitRepository.getAllModulesInOrgUnits.and.returnValue(utils.getPromise(q, usersModules));
                reportService.getReportDataForOrgUnit.and.callFake(function(chart, moduleId) {
                    if (moduleId === 'Mod1')
                        return utils.getPromise(q, 'data1');
                    if (moduleId === 'Mod2')
                        return utils.getRejectedPromise(q, { errorCode: 'NETWORK_UNAVAILABLE' });
                });

                downloadChartDataConsumer.run();
                scope.$apply();

                expect(chartRepository.upsertChartData).not.toHaveBeenCalledWith(mockChart.id, 'Mod2', 'data2');
                expect(chartRepository.upsertChartData).not.toHaveBeenCalledWith(mockChart.id, 'Mod1', 'data1');
            });

            it('should not download chart data if user has no modules', function() {
                orgUnitRepository.getAllModulesInOrgUnits.and.returnValue(utils.getPromise(q, []));

                downloadChartDataConsumer.run();
                scope.$apply();

                expect(reportService.getReportDataForOrgUnit).not.toHaveBeenCalled();
            });

            it('should not download weekly chart data if it has already been downloaded that same day', function() {
                var mockWeeklyChart = {
                    id: 'someChartId',
                    weeklyChart: true
                };
                chartRepository.getAll.and.returnValue(utils.getPromise(q, [mockWeeklyChart]));
                changeLogRepository.get.and.returnValue(utils.getPromise(q, moment(currentTime).subtract(1, 'hour').toISOString()));

                downloadChartDataConsumer.run();
                scope.$apply();

                expect(reportService.getReportDataForOrgUnit).not.toHaveBeenCalled();
                expect(changeLogRepository.upsert).not.toHaveBeenCalledWith('weeklyChartData:' + mockProjectId, currentTime.toISOString());
            });

            it('should not download monthly chart data if it has already been downloaded that same day', function() {
                var mockMonthlyChart = {
                    id: 'someChartId',
                    monthlyChart: true
                };

                var lastDownloadedTime = moment('2014-10-01T12:00:00.000Z').toISOString();

                chartRepository.getAll.and.returnValue(utils.getPromise(q, [mockMonthlyChart]));
                changeLogRepository.get.and.returnValue(utils.getPromise(q, lastDownloadedTime));

                downloadChartDataConsumer.run();
                scope.$apply();

                expect(reportService.getReportDataForOrgUnit).not.toHaveBeenCalled();
                expect(changeLogRepository.upsert).not.toHaveBeenCalledWith('monthlyChartData:' + mockProjectId, currentTime.toISOString());
            });

            it('should not download yearly chart data if it has already been downloaded that same week', function() {
                var mockYearlyChart = {
                    id: 'someChartId',
                    yearlyChart: true
                };

                var lastDownloadedTime = moment('2014-10-03T12:00:00.000Z').toISOString();

                chartRepository.getAll.and.returnValue(utils.getPromise(q, [mockYearlyChart]));
                changeLogRepository.get.and.returnValue(utils.getPromise(q, lastDownloadedTime));

                downloadChartDataConsumer.run();
                scope.$apply();

                expect(reportService.getReportDataForOrgUnit).not.toHaveBeenCalled();
                expect(changeLogRepository.upsert).not.toHaveBeenCalledWith('yearlyChartData:' + mockProjectId, currentTime.toISOString());
            });

            it('should download monthly chart data if it has not been downloaded in the same day', function() {
                var mockMonthlyChart = {
                    id: 'someChartId',
                    monthlyChart: true,
                    serviceCode: 'someDataSetServiceCode'
                };

                var lastDownloadedTime = moment('2014-10-01T12:00:00.000Z').toISOString();
                currentTime = moment('2014-10-02T12:00:00.000Z');
                Timecop.freeze(currentTime);

                chartRepository.getAll.and.returnValue(utils.getPromise(q, [mockMonthlyChart]));
                changeLogRepository.get.and.returnValue(utils.getPromise(q, lastDownloadedTime));

                downloadChartDataConsumer.run();
                scope.$apply();

                expect(reportService.getReportDataForOrgUnit).toHaveBeenCalled();
            });

        });
    });
