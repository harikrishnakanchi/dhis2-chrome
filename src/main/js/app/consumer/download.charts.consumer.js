define([], function () {
    return function(reportService, systemInfoService, chartRepository, changeLogRepository) {
        var downloadStartTime;
        var getServerTime = function () {
          return systemInfoService.getServerDate().then(function (serverTime) {
              downloadStartTime = serverTime;
          });
        };

        var updateChangeLog = function() {
            return changeLogRepository.upsert('charts', downloadStartTime);
        };

        var removeChartsThatHaveBeenDeletedRemotely = function() {
            return reportService.getAllChartIds().then(function(remoteChartIds) {
                return chartRepository.getAll().then(function(localDbCharts) {
                    var localDbChartIds = _.pluck(localDbCharts, 'id');
                    var chartIdsToRemove = _.difference(localDbChartIds, remoteChartIds);
                    return chartRepository.deleteMultipleChartsById(chartIdsToRemove);
                });
            });
        };

        this.run = function() {
            return getServerTime()
                .then(_.partial(changeLogRepository.get, 'charts'))
                .then(reportService.getUpdatedCharts)
                .then(chartRepository.upsert)
                .then(updateChangeLog)
                .then(removeChartsThatHaveBeenDeletedRemotely);
        };
    };
});