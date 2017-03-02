define(['downloadChartsConsumer', 'angularMocks', 'utils', 'reportService', 'systemInfoService', 'chartRepository', 'changeLogRepository'],
    function (DownloadChartsConsumer, mocks, utils, ReportService, SystemInfoService, ChartRepository, ChangeLogRepository) {
        describe('DownloadChartsConsumer', function () {
            var scope, q,
                downloadChartsConsumer,
                reportService, systemInfoService, chartRepository, changeLogRepository,
                lastUpdated, currentTime;

            beforeEach(mocks.inject(function($q, $rootScope) {

                scope = $rootScope;
                q = $q;

                reportService = new ReportService();
                spyOn(reportService, 'getUpdatedCharts').and.returnValue(utils.getPromise(q, {}));
                spyOn(reportService, 'getAllChartIds').and.returnValue(utils.getPromise(q, {}));

                chartRepository = new ChartRepository();
                spyOn(chartRepository, 'upsert').and.returnValue(utils.getPromise(q, {}));
                spyOn(chartRepository, 'getAll').and.returnValue(utils.getPromise(q, {}));
                spyOn(chartRepository, 'deleteMultipleChartsById').and.returnValue(utils.getPromise(q, {}));

                changeLogRepository = new ChangeLogRepository();
                spyOn(changeLogRepository, 'get').and.returnValue(utils.getPromise(q, lastUpdated));
                spyOn(changeLogRepository, 'upsert').and.returnValue(utils.getPromise(q, {}));

                systemInfoService = new SystemInfoService();
                spyOn(systemInfoService, 'getServerDate').and.returnValue(utils.getPromise(q, {}));

                downloadChartsConsumer = new DownloadChartsConsumer(reportService, systemInfoService, chartRepository, changeLogRepository);
            }));

            it('should download and upsert any charts that have been updated', function () {
                var updatedCharts = [{
                    'id': 'updatedChartId',
                    'some': 'details'
                }];
                reportService.getUpdatedCharts.and.returnValue(utils.getPromise(q, updatedCharts));

                downloadChartsConsumer.run();
                scope.$apply();

                expect(changeLogRepository.get).toHaveBeenCalledWith('charts', undefined);
                expect(reportService.getUpdatedCharts).toHaveBeenCalledWith(lastUpdated);
                expect(chartRepository.upsert).toHaveBeenCalledWith(updatedCharts);
            });

            it('should update the system time in the changeLog', function () {
                systemInfoService.getServerDate.and.returnValue(utils.getPromise(q, 'someTime'));
                downloadChartsConsumer.run();
                scope.$apply();

                expect(changeLogRepository.upsert).toHaveBeenCalledWith('charts', 'someTime');
            });

            it('should delete any charts that are stored locally but not available remotely on DHIS', function () {
                var remoteChartIds = ['chart2', 'chart3'];
                var localDbCharts = [{
                    'id': 'chart1',
                    'some': 'details'
                }, {
                    'id': 'chart2',
                    'some': 'details'
                }];
                reportService.getAllChartIds.and.returnValue(utils.getPromise(q, remoteChartIds));
                chartRepository.getAll.and.returnValue(utils.getPromise(q, localDbCharts));

                downloadChartsConsumer.run();
                scope.$apply();

                expect(chartRepository.deleteMultipleChartsById).toHaveBeenCalledWith(['chart1']);
            });

        });
    });