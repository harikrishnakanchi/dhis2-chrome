define(['moment'], function(moment) {
    return function(reportService, systemInfoService, pivotTableRepository, changeLogRepository) {
        var downloadStartTime;

        var getServerTime = function () {
            return systemInfoService.getServerDate().then(function (serverTime) {
                downloadStartTime = serverTime;
            });
        };

        var updateChangeLog = function() {
            return changeLogRepository.upsert('pivotTables', downloadStartTime);
        };

        var removePivotTablesThatHaveBeenDeletedRemotely = function() {
            return reportService.getAllPivotTableIds().then(function(remotePivotTableIds) {
                return pivotTableRepository.getAll().then(function(localDbPivotTables) {
                    var localDbPivotTableIds = _.pluck(localDbPivotTables, 'id');
                    var pivotTableIdsToRemove = _.difference(localDbPivotTableIds, remotePivotTableIds);
                    return pivotTableRepository.deleteByIds(pivotTableIdsToRemove);
                });
            });
        };

        this.run = function () {
            return getServerTime()
                .then(_.partial(changeLogRepository.get, 'pivotTables'))
                .then(reportService.getUpdatedPivotTables)
                .then(pivotTableRepository.upsert)
                .then(updateChangeLog)
                .then(removePivotTablesThatHaveBeenDeletedRemotely);
        };
    };
});