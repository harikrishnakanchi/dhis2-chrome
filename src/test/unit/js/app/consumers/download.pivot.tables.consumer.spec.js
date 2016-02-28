define(['downloadPivotTablesConsumer', 'angularMocks', 'utils', 'timecop', 'reportService', 'pivotTableRepository', 'changeLogRepository'],
    function(DownloadPivotTablesConsumer, mocks, utils, timecop, ReportService, PivotTableRepository, ChangeLogRepository) {
        describe('DownloadPivotTablesConsumer', function() {
            var scope, q,
                downloadPivotTablesConsumer,
                reportService, pivotTableRepository, changeLogRepository,
                lastUpdated, currentTime;

            beforeEach(mocks.inject(function($q, $rootScope) {
                scope = $rootScope;
                q = $q;

                reportService = new ReportService();
                spyOn(reportService, 'getUpdatedPivotTables').and.returnValue(utils.getPromise(q, {}));

                pivotTableRepository = new PivotTableRepository();
                spyOn(pivotTableRepository, 'upsert').and.returnValue(utils.getPromise(q, {}));

                lastUpdated = new Date('2016-02-29T00:40:00.000Z');
                changeLogRepository = new ChangeLogRepository();
                spyOn(changeLogRepository, 'get').and.returnValue(utils.getPromise(q, lastUpdated));
                spyOn(changeLogRepository, 'upsert').and.returnValue(utils.getPromise(q, {}));

                currentTime = '2016-02-29T00:41:00.000Z';
                Timecop.install();
                Timecop.freeze(currentTime);

                downloadPivotTablesConsumer = new DownloadPivotTablesConsumer(reportService, pivotTableRepository, changeLogRepository, $q);
            }));

            it('should download and upsert any pivot tables that have been updated', function () {
                var updatedPivotTables = [{
                    'id': 'updatedPivotTableId',
                    'some': 'details'
                }];
                reportService.getUpdatedPivotTables.and.returnValue(utils.getPromise(q, updatedPivotTables));

                downloadPivotTablesConsumer.run();
                scope.$apply();

                expect(changeLogRepository.get).toHaveBeenCalledWith('pivotTables');
                expect(reportService.getUpdatedPivotTables).toHaveBeenCalledWith(lastUpdated);
                expect(pivotTableRepository.upsert).toHaveBeenCalledWith(updatedPivotTables);
            });

            it('should update the lastUpdated time in the changeLog', function () {
                downloadPivotTablesConsumer.run();
                scope.$apply();

                expect(changeLogRepository.upsert).toHaveBeenCalledWith('pivotTables', currentTime);
            });
       });
    });