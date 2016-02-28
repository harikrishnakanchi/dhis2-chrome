define(['moment'], function (moment) {
    return function(reportService, chartRepository, changeLogRepository) {
        var updateChangeLog = function() {
            return changeLogRepository.upsert('charts', moment().toISOString());
        };

        var removeChartsThatHaveBeenDeletedRemotely = function() {
            return reportService.getAllChartIds().then(function(remoteChartIds) {
                return chartRepository.getAll().then(function(localDbCharts) {
                    var localDbChartIds = _.pluck(localDbCharts, 'id');
                    var chartIdsToRemove = _.difference(localDbChartIds, remoteChartIds);
                    return chartRepository.deleteMultipleChartsById(chartIdsToRemove, localDbCharts);
                });
            });
        };

        this.run = function() {
            return changeLogRepository.get('charts')
                .then(reportService.getUpdatedCharts)
                .then(chartRepository.upsert)
                .then(updateChangeLog)
                .then(removeChartsThatHaveBeenDeletedRemotely);
        };
    };
});