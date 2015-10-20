define(["lodash"], function(_) {
    return function(pivotTableService, pivotTableRepository, userPreferenceRepository, $q, datasetRepository) {
        this.run = function(message) {

            var saveTables = function(tables) {
                return pivotTableRepository.upsert(tables).then(function() {
                    return tables;
                });
            };

            var loadUserModuleIds = function() {
                return userPreferenceRepository.getUserModules().then(function(modules) {
                    return _.pluck(modules, "id");
                });
            };

            var loadRelevantDatasets = function(moduleIds) {
                return datasetRepository.findAllForOrgUnits(moduleIds);
            };

            var getTables = function(datasets) {
                return pivotTableService.getAllTablesForDataset(datasets);
            };

            var saveTableData = function(userModuleIds, tables) {
                return _.forEach(userModuleIds, function(userModule) {
                    return _.forEach(tables, function(table) {
                        return pivotTableService.getPivotTableDataForOrgUnit(table, userModule).then(function(data) {
                            return pivotTableRepository.upsertPivotTableData(table.name, userModule, data);
                        });
                    });
                });
            };

            loadUserModuleIds().then(function(userModuleIds){
                if(_.isEmpty(userModuleIds))
                    return;

                loadRelevantDatasets(userModuleIds)
                    .then(getTables)
                    .then(saveTables)
                    .then(_.partial(saveTableData, userModuleIds, _));
            });
        };
    };
});
