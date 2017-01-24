define(['downloadPivotTablesConsumer', 'angularMocks', 'utils', 'timecop', 'reportService', 'systemInfoService', 'pivotTableRepository', 'changeLogRepository'],
    function(DownloadPivotTablesConsumer, mocks, utils, timecop, ReportService, SystemInfoService, PivotTableRepository, ChangeLogRepository) {
        describe('DownloadPivotTablesConsumer', function() {
            var scope, q,
                downloadPivotTablesConsumer,
                reportService, systemInfoService, pivotTableRepository, changeLogRepository,
                lastUpdated, currentTime;

            beforeEach(mocks.inject(function($q, $rootScope) {
                scope = $rootScope;
                q = $q;

                reportService = new ReportService();
                spyOn(reportService, 'getUpdatedPivotTables').and.returnValue(utils.getPromise(q, {}));
                spyOn(reportService, 'getAllPivotTableIds').and.returnValue(utils.getPromise(q, {}));

                systemInfoService = new SystemInfoService();
                spyOn(systemInfoService, 'getServerDate').and.returnValue(utils.getPromise(q, ''));

                pivotTableRepository = new PivotTableRepository();
                spyOn(pivotTableRepository, 'upsert').and.returnValue(utils.getPromise(q, {}));
                spyOn(pivotTableRepository, 'getAll').and.returnValue(utils.getPromise(q, {}));
                spyOn(pivotTableRepository, 'deleteByIds').and.returnValue(utils.getPromise(q, {}));

                lastUpdated = new Date('2016-02-29T00:40:00.000Z');
                changeLogRepository = new ChangeLogRepository();
                spyOn(changeLogRepository, 'get').and.returnValue(utils.getPromise(q, lastUpdated));
                spyOn(changeLogRepository, 'upsert').and.returnValue(utils.getPromise(q, {}));

                downloadPivotTablesConsumer = new DownloadPivotTablesConsumer(reportService, systemInfoService, pivotTableRepository, changeLogRepository, $q);
            }));

            it('should download and upsert any pivot tables that have been updated', function () {
                var updatedPivotTables = [{
                    'id': 'updatedPivotTableId',
                    'some': 'details'
                }];
                reportService.getUpdatedPivotTables.and.returnValue(utils.getPromise(q, updatedPivotTables));

                downloadPivotTablesConsumer.run();
                scope.$apply();

                expect(changeLogRepository.get).toHaveBeenCalledWith('pivotTables', undefined);
                expect(reportService.getUpdatedPivotTables).toHaveBeenCalledWith(lastUpdated);
                expect(pivotTableRepository.upsert).toHaveBeenCalledWith(updatedPivotTables);
            });

            it('should update the lastUpdated time in the changeLog with the server time', function () {
                systemInfoService.getServerDate.and.returnValue(utils.getPromise(q, 'someTime'));
                downloadPivotTablesConsumer.run();
                scope.$apply();

                expect(changeLogRepository.upsert).toHaveBeenCalledWith('pivotTables', 'someTime');
            });

            it('should delete any charts that are stored locally but not available remotely on DHIS', function () {
                var remotePivotTableIds = ['pivotTable2', 'pivotTable3'];
                var localDbPivotTables = [{
                    'id': 'pivotTable1',
                    'some': 'details'
                }, {
                    'id': 'pivotTable2',
                    'some': 'details'
                }];
                reportService.getAllPivotTableIds.and.returnValue(utils.getPromise(q, remotePivotTableIds));
                pivotTableRepository.getAll.and.returnValue(utils.getPromise(q, localDbPivotTables));

                downloadPivotTablesConsumer.run();
                scope.$apply();

                expect(pivotTableRepository.deleteByIds).toHaveBeenCalledWith(['pivotTable1']);
            });
       });
    });