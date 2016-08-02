define(['moment'], function(moment) {
    return function(reportService, pivotTableRepository, changeLogRepository) {
        var updateChangeLog = function() {
            return changeLogRepository.upsert('pivotTables', moment().toISOString());
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

        this.run = function() {
            return changeLogRepository.get('pivotTables')
                .then(reportService.getUpdatedPivotTables)
                .then(pivotTableRepository.upsert)
                .then(updateChangeLog)
                .then(removePivotTablesThatHaveBeenDeletedRemotely);
        };
    };
});