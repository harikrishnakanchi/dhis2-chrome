define([], function() {
    return function(systemInfoService, changeLogRepository, reportService, eventReportRepository) {
        var downloadStartTime;

        var getServerTime = function () {
            return systemInfoService.getServerDate().then(function (serverTime) {
                downloadStartTime = serverTime;
            });
        };

        var updateChangeLog = function() {
            return changeLogRepository.upsert('eventReports', downloadStartTime);
        };

        var removeEventReportsThatHaveBeenDeletedRemotely = function() {
            return reportService.getAllEventReportIds().then(function(remoteEventReportIds) {
                return eventReportRepository.getAll().then(function(localDbEventReports) {
                    var localDbEventReportIds = _.pluck(localDbEventReports, 'id');
                    var eventReportIdsIdsToRemove = _.difference(localDbEventReportIds, remoteEventReportIds);
                    return eventReportRepository.deleteEventReportsById(eventReportIdsIdsToRemove);
                });
            });
        };

        this.run = function () {
            return getServerTime()
                .then(_.partial(changeLogRepository.get, 'eventReports'))
                .then(reportService.getUpdatedEventReports)
                .then(eventReportRepository.upsert)
                .then(updateChangeLog)
                .then(removeEventReportsThatHaveBeenDeletedRemotely);
        };
    };
});
