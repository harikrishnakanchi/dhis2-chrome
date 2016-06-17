define(['downloadChartDataConsumer', 'angularMocks', 'utils', 'timecop', 'moment', 'reportService', 'chartRepository', 'userPreferenceRepository', 'datasetRepository', 'changeLogRepository', 'orgUnitRepository'],
    function(DownloadChartDataConsumer, mocks, utils, timecop, moment, ReportService, ChartRepository, UserPreferenceRepository, DatasetRepository, ChangeLogRepository, OrgUnitRepository) {

        describe('Download Chart Data Consumer', function() {
            var downloadChartDataConsumer,
                reportService, chartRepository, userPreferenceRepository, datasetRepository, changeLogRepository, orgUnitRepository,
                scope, q, currentTime, mockProjectId, mockModule, mockDataSet, mockChart;

            beforeEach(mocks.inject(function($q, $rootScope) {
                scope = $rootScope;
                q = $q;

                mockProjectId = 'someProjectId';
                mockModule = {
                    id: 'someModuleId'
                };
                mockDataSet = {
                    id: 'someDataSetId',
                    code: 'someDataSetCode'
                };
                mockChart = {
                    id: 'someChartId',
                    name: 'FieldApp - someDataSetCode'
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

                changeLogRepository = new ChangeLogRepository();
                spyOn(changeLogRepository, 'get').and.returnValue(utils.getPromise(q, null));
                spyOn(changeLogRepository, 'upsert').and.returnValue(utils.getPromise(q, {}));

                currentTime = moment('2014-10-01T12:00:00.000Z');
                Timecop.install();
                Timecop.freeze(currentTime.toISOString());

                downloadChartDataConsumer = new DownloadChartDataConsumer(reportService, chartRepository, userPreferenceRepository, datasetRepository, changeLogRepository, orgUnitRepository, $q);
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

            it('should retrieve the lastUpdated time from the changeLog', function() {
                downloadChartDataConsumer.run();
                scope.$apply();

                expect(changeLogRepository.get).toHaveBeenCalledWith('weeklyChartData:' + mockProjectId);
                expect(changeLogRepository.get).toHaveBeenCalledWith('monthlyChartData:' + mockProjectId);
            });

            it('should update the lastUpdated time in the changeLog', function() {
                downloadChartDataConsumer.run();
                scope.$apply();

                expect(changeLogRepository.upsert).toHaveBeenCalledWith('weeklyChartData:' + mockProjectId, currentTime.toISOString());
                expect(changeLogRepository.upsert).toHaveBeenCalledWith('monthlyChartData:' + mockProjectId, currentTime.toISOString());
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

                expect(datasetRepository.findAllForOrgUnits).toHaveBeenCalledWith([mockModuleA.id]);
                expect(datasetRepository.findAllForOrgUnits).toHaveBeenCalledWith([mockModuleB.id]);
            });

            it('should retrieve dataSets for module and its origins', function() {
                var mockOrigin = {
                    id: 'mockOriginId'
                };

                orgUnitRepository.findAllByParent.and.returnValue(utils.getPromise(q, [mockOrigin]));
                downloadChartDataConsumer.run();
                scope.$apply();

                expect(datasetRepository.findAllForOrgUnits).toHaveBeenCalledWith([mockModule.id, mockOrigin.id]);
            });

            it('should save chart data to the database', function() {
                var mockChartData = {
                    some: 'data'
                };

                reportService.getReportDataForOrgUnit.and.returnValue(utils.getPromise(q, mockChartData));

                downloadChartDataConsumer.run();
                scope.$apply();

                expect(chartRepository.upsertChartData).toHaveBeenCalledWith(mockChart.name, mockModule.id, mockChartData);
                });

            it('should download chart data for relevant modules and datasets', function() {
                var chartRelevantToDataSet = {
                    id: 'mockChartId',
                    name: 'FieldApp - ' + mockDataSet.code
                }, someOtherChart = {
                    id: 'mockChartId',
                    name: 'FieldApp - someOtherDataSetCode'
                };
                chartRepository.getAll.and.returnValue(utils.getPromise(q, [chartRelevantToDataSet, someOtherChart]));

                downloadChartDataConsumer.run();
                scope.$apply();

                expect(reportService.getReportDataForOrgUnit).toHaveBeenCalledWith(chartRelevantToDataSet, mockModule.id);
                expect(reportService.getReportDataForOrgUnit).not.toHaveBeenCalledWith(someOtherChart, mockModule.id);
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

                expect(chartRepository.upsertChartData).toHaveBeenCalledWith(mockChart.name, 'Mod1', 'data1');
                expect(chartRepository.upsertChartData).not.toHaveBeenCalledWith(mockChart.name, 'Mod2', 'data2');
                expect(chartRepository.upsertChartData).toHaveBeenCalledWith(mockChart.name, 'Mod3', 'data3');
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
                    name: 'FieldApp - someDataSetCode',
                    weeklyChart: true
                };
                chartRepository.getAll.and.returnValue(utils.getPromise(q, [mockWeeklyChart]));
                changeLogRepository.get.and.returnValue(utils.getPromise(q, moment(currentTime).subtract(1, 'hour').toISOString()));

                downloadChartDataConsumer.run();
                scope.$apply();

                expect(reportService.getReportDataForOrgUnit).not.toHaveBeenCalled();
                expect(changeLogRepository.upsert).not.toHaveBeenCalledWith('weeklyChartData:' + mockProjectId, currentTime.toISOString());
            });

            it('should not download monthly chart data if it has already been downloaded in the last 7 days', function() {
                var mockMonthlyChart = {
                    id: 'someChartId',
                    name: 'FieldApp - someDataSetCode',
                    monthlyChart: true
                };
                chartRepository.getAll.and.returnValue(utils.getPromise(q, [mockMonthlyChart]));
                changeLogRepository.get.and.returnValue(utils.getPromise(q, moment(currentTime).subtract(2, 'days').toISOString()));

                downloadChartDataConsumer.run();
                scope.$apply();

                expect(reportService.getReportDataForOrgUnit).not.toHaveBeenCalled();
                expect(changeLogRepository.upsert).not.toHaveBeenCalledWith('monthlyChartData:' + mockProjectId, currentTime.toISOString());
            });
        });
    });
