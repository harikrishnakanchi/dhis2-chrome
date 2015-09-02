define(["lodash"], function(_) {
    return function(pivotTableService, pivotTableRepository, userPreferenceRepository, $q, datasetRepository) {
        var userModuleIds;
        this.run = function(message) {

            var saveTables = function(tables) {
                return pivotTableRepository.upsert(tables).then(function() {
                    return tables;
                });
            };

            var loadUserModuleIds = function() {
                return userPreferenceRepository.getUserModules().then(function(modules) {
                    userModuleIds = _.pluck(modules, "id");
                    return userModuleIds;
                });
            };

            var loadRelevantDatasets = function(moduleIds) {
                return datasetRepository.findAllForOrgUnits(moduleIds);
            };

            var getTables = function(datasets) {
                return pivotTableService.getAllTablesForDataset(datasets);
            };

            var saveTableData = function(tables) {
                return _.forEach(userModuleIds, function(userModule) {
                    return _.forEach(tables, function(table) {
                        return pivotTableService.getPivotTableDataForOrgUnit(table, userModule).then(function(data) {
                            return pivotTableRepository.upsertPivotTableData(table.name, userModule, data);
                        });
                    });
                });
            };

            return loadUserModuleIds().then(loadRelevantDatasets).then(getTables).then(saveTables).then(saveTableData);
        };
    };
});