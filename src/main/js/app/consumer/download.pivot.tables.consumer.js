define(['moment'], function(moment) {
    return function(reportService, pivotTableRepository, changeLogRepository) {
        var updateChangeLog = function() {
            return changeLogRepository.upsert('pivotTables', moment().toISOString());
        };

        this.run = function() {
            return changeLogRepository.get('pivotTables')
                .then(reportService.getUpdatedPivotTables)
                .then(pivotTableRepository.upsert)
                .then(updateChangeLog);
        };
    };
});