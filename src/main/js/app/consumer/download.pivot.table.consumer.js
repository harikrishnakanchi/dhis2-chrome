define(["lodash"], function(_) {
    return function(pivotTableService, pivotTableRepository, userPreferenceRepository, $q) {
        this.run = function(message) {
            var saveTables = function(tables) {
                return pivotTableRepository.upsert(tables).then(function() {
                    return tables;
                });
            };
            var loadUserModuleIds = function() {
                return userPreferenceRepository.getUserModules().then(function(modules) {
                    var userModuleIds = _.pluck(modules, "id");
                    return userModuleIds;
                });
            };

            var saveTableData = function(data) {
                var tables = data[0];
                var userModuleIds = data[1];
                console.log('data -------------', data, tables, userModuleIds);
                return _.forEach(userModuleIds, function(userModule) {
                    return _.forEach(tables, function(table) {
                        return pivotTableService.getPivotTableDataForOrgUnit(table, userModule).then(function(data) {
                            return pivotTableRepository.upsertPivotTableData(table.name, userModule, data);
                        });
                    });
                });
            };
            return $q.all([pivotTableService.getAllPivotTables().then(saveTables), loadUserModuleIds()]).then(saveTableData);
        };
    };
});