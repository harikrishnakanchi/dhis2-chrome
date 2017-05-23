define(['downloadEventReportsConsumer', 'angularMocks', 'utils', 'timecop', 'reportService', 'systemInfoService', 'eventReportRepository', 'changeLogRepository'],
    function(DownloadEventReportsConsumer, mocks, utils, timecop, ReportService, SystemInfoService, EventReportRepository, ChangeLogRepository) {
        describe('DownloadEventReportsConsumer', function() {
            var scope, q,
                downloadEventReportsConsumer,
                reportService, systemInfoService, eventReportRepository, changeLogRepository,
                lastUpdated;

            beforeEach(mocks.inject(function($q, $rootScope) {
                scope = $rootScope;
                q = $q;

                reportService = new ReportService();
                spyOn(reportService, 'getUpdatedEventReports').and.returnValue(utils.getPromise(q, {}));
                spyOn(reportService, 'getAllEventReportIds').and.returnValue(utils.getPromise(q, {}));

                systemInfoService = new SystemInfoService();
                spyOn(systemInfoService, 'getServerDate').and.returnValue(utils.getPromise(q, ''));

                eventReportRepository = new EventReportRepository();
                spyOn(eventReportRepository, 'upsert').and.returnValue(utils.getPromise(q, {}));
                spyOn(eventReportRepository, 'getAll').and.returnValue(utils.getPromise(q, {}));
                spyOn(eventReportRepository, 'deleteEventReportsById').and.returnValue(utils.getPromise(q, {}));

                lastUpdated = new Date('2016-02-29T00:40:00.000Z');
                changeLogRepository = new ChangeLogRepository();
                spyOn(changeLogRepository, 'get').and.returnValue(utils.getPromise(q, lastUpdated));
                spyOn(changeLogRepository, 'upsert').and.returnValue(utils.getPromise(q, {}));

                downloadEventReportsConsumer = new DownloadEventReportsConsumer(systemInfoService, changeLogRepository, reportService, eventReportRepository, $q);
            }));

            it('should download and upsert any event reports that have been updated', function () {
                var updatedEventReports = [{
                    'id': 'updatedEventReportId',
                    'some': 'details'
                }];
                reportService.getUpdatedEventReports.and.returnValue(utils.getPromise(q, updatedEventReports));

                downloadEventReportsConsumer.run();
                scope.$apply();

                expect(changeLogRepository.get).toHaveBeenCalledWith('eventReports', undefined);
                expect(reportService.getUpdatedEventReports).toHaveBeenCalledWith(lastUpdated);
                expect(eventReportRepository.upsert).toHaveBeenCalledWith(updatedEventReports);
            });

            it('should update the lastUpdated time in the changeLog with the server time', function () {
                systemInfoService.getServerDate.and.returnValue(utils.getPromise(q, 'someTime'));
                downloadEventReportsConsumer.run();
                scope.$apply();

                expect(changeLogRepository.upsert).toHaveBeenCalledWith('eventReports', 'someTime');
            });

            it('should delete any event reports that are stored locally but not available remotely on DHIS', function () {
                var remoteEventReportIds = ['eventReport2', 'eventReport3'];
                var localDbEventReports = [{
                    'id': 'eventReport1',
                    'some': 'details'
                }, {
                    'id': 'eventReport2',
                    'some': 'details'
                }];
                reportService.getAllEventReportIds.and.returnValue(utils.getPromise(q, remoteEventReportIds));
                eventReportRepository.getAll.and.returnValue(utils.getPromise(q, localDbEventReports));

                downloadEventReportsConsumer.run();
                scope.$apply();

                expect(eventReportRepository.deleteEventReportsById).toHaveBeenCalledWith(['eventReport1']);
            });
        });
    });