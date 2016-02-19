define(['downloadChartsConsumer', 'angularMocks', 'utils', 'timecop', 'reportService', 'chartRepository', 'changeLogRepository'],
    function (DownloadChartsConsumer, mocks, utils, timecop, ReportService, ChartRepository, ChangeLogRepository) {
        describe('DownloadChartsConsumer', function () {
            var scope, q,
                downloadChartsConsumer,
                reportService, chartRepository, changeLogRepository,
                lastUpdated, currentTime;

            beforeEach(mocks.inject(function($q, $rootScope) {

                scope = $rootScope;
                q = $q;

                reportService = new ReportService();
                spyOn(reportService, 'getAllCharts').and.returnValue(utils.getPromise(q, {}));
                spyOn(reportService, 'getAllCurrentChartIds').and.returnValue(utils.getPromise(q, {}));

                chartRepository = new ChartRepository();
                spyOn(chartRepository, 'upsert').and.returnValue(utils.getPromise(q, {}));
                spyOn(chartRepository, 'getAll').and.returnValue(utils.getPromise(q, {}));
                spyOn(chartRepository, 'deleteMultipleChartsById').and.returnValue(utils.getPromise(q, {}));

                lastUpdated = new Date('2016-02-19T09:42:00.000Z');
                changeLogRepository = new ChangeLogRepository();
                spyOn(changeLogRepository, 'get').and.returnValue(utils.getPromise(q, lastUpdated));
                spyOn(changeLogRepository, 'upsert').and.returnValue(utils.getPromise(q, {}));

                currentTime = '2016-02-19T10:11:00.000Z';
                Timecop.install();
                Timecop.freeze(currentTime);

                downloadChartsConsumer = new DownloadChartsConsumer(reportService, chartRepository, changeLogRepository, $q);
            }));

            it('should download and upsert any charts that have been updated', function () {
                var updatedCharts = [{
                    'id': 'updatedChartId',
                    'some': 'details'
                }];
                reportService.getAllCharts.and.returnValue(utils.getPromise(q, updatedCharts));

                downloadChartsConsumer.run();
                scope.$apply();

                expect(changeLogRepository.get).toHaveBeenCalledWith('charts');
                expect(reportService.getAllCharts).toHaveBeenCalledWith(lastUpdated);
                expect(chartRepository.upsert).toHaveBeenCalledWith(updatedCharts);
            });

            it('should update the lastUpdated time in the changeLog', function () {
                downloadChartsConsumer.run();
                scope.$apply();

                expect(changeLogRepository.upsert).toHaveBeenCalledWith('charts', currentTime);
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
                reportService.getAllCurrentChartIds.and.returnValue(utils.getPromise(q, remoteChartIds));
                chartRepository.getAll.and.returnValue(utils.getPromise(q, localDbCharts));

                downloadChartsConsumer.run();
                scope.$apply();

                expect(chartRepository.deleteMultipleChartsById).toHaveBeenCalledWith(['chart1'], localDbCharts);
            });

        });
    });