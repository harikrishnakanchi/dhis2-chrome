define(["lodash"], function(_) {
    return function(pivotTableService, pivotTableRepository) {
        this.run = function(message) {
            var saveTables = function(tables) {
                return pivotTableRepository.upsert(tables).then(function(data) {
                    return tables;
                });
            };
            pivotTableService.getAllPivotTables().then(saveTables);
        };
    };
});