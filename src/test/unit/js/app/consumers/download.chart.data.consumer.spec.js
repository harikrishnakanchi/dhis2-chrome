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
                spyOn(userPreferenceRepository, 'getCurrentUsersModules').and.returnValue(utils.getPromise(q, [mockModule]));

                orgUnitRepository = new OrgUnitRepository();
                spyOn(orgUnitRepository, 'findAllByParent').and.returnValue(utils.getPromise(q, []));

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

            it('should retrieve the current users modules', function() {
                downloadChartDataConsumer.run();
                scope.$apply();

                expect(userPreferenceRepository.getCurrentUsersModules).toHaveBeenCalled();
            });

            it('should retrieve the lastUpdated time from the changeLog', function() {
                downloadChartDataConsumer.run();
                scope.$apply();

                expect(changeLogRepository.get).toHaveBeenCalledWith('chartData:' + mockProjectId);
            });

            it('should update the lastUpdated time in the changeLog', function() {
                downloadChartDataConsumer.run();
                scope.$apply();

                expect(changeLogRepository.upsert).toHaveBeenCalledWith('chartData:' + mockProjectId, currentTime.toISOString());
            });

            it('should retrieve dataSets for each module', function() {
                var mockModuleA = {
                    id: 'mockModuleIdA'
                }, mockModuleB = {
                    id: 'mockModuleIdB'
                };
                userPreferenceRepository.getCurrentUsersModules.and.returnValue(utils.getPromise(q, [mockModuleA, mockModuleB]));

                downloadChartDataConsumer.run();
                scope.$apply();

                expect(datasetRepository.findAllForOrgUnits).toHaveBeenCalledWith([mockModuleA.id, undefined]);
                expect(datasetRepository.findAllForOrgUnits).toHaveBeenCalledWith([mockModuleB.id, undefined]);
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

                userPreferenceRepository.getCurrentUsersModules.and.returnValue(utils.getPromise(q, usersModules));
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
                userPreferenceRepository.getCurrentUsersModules.and.returnValue(utils.getPromise(q, []));

                downloadChartDataConsumer.run();
                scope.$apply();

                expect(reportService.getReportDataForOrgUnit).not.toHaveBeenCalled();
            });

            it('should not download chart data if it has already been downloaded that same day', function() {
                changeLogRepository.get.and.returnValue(utils.getPromise(q, moment(currentTime).subtract(1, 'hour').toISOString()));

                downloadChartDataConsumer.run();
                scope.$apply();

                expect(reportService.getReportDataForOrgUnit).not.toHaveBeenCalled();
            });
        });
    });
