define(["lodash", "moment"], function(_, moment) {
    return function(reportService, pivotTableRepository, userPreferenceRepository, datasetRepository, changeLogRepository, orgUnitRepository, $q) {

        this.run = function(message) {
            var updateChangeLog = function(changeLogKey) {
                return changeLogRepository.upsert(changeLogKey, moment().toISOString());
            };

            var loadUserProjectsAndModuleIds = function() {
                return $q.all({
                    usersProjectIds: userPreferenceRepository.getCurrentProjects(),
                    usersModuleIds: userPreferenceRepository.getUserModules().then(function(modules) {
                        return _.pluck(modules, 'id');
                    })
                });
            };

            var downloadRelevantPivotTableData = function(pivotTables, userModuleIds, changeLogKey) {
                var downloadOfAtLeastOneReportFailed = false;

                var recursivelyDownloadAndUpsertPivotTableData = function(modulesAndTables) {
                    var onSuccess = function(data) {
                        return pivotTableRepository.upsertPivotTableData(datum.pivotTable.name, datum.moduleId, data).then(function() {
                            return recursivelyDownloadAndUpsertPivotTableData(modulesAndTables);
                        });
                    };

                    var onFailure = function() {
                        downloadOfAtLeastOneReportFailed = true;
                        return recursivelyDownloadAndUpsertPivotTableData(modulesAndTables);
                    };

                    if (_.isEmpty(modulesAndTables))
                        return $q.when({});

                    var datum = modulesAndTables.pop();
                    return reportService.getReportDataForOrgUnit(datum.pivotTable, datum.moduleId).then(onSuccess, onFailure);
                };

                var getDatasetsRelevantToEachModule = function() {
                    var moduleIdsAndOrigins = _.reduce(userModuleIds, function(mapOfModuleIdsToOrigins, moduleId) {
                        mapOfModuleIdsToOrigins[moduleId] = orgUnitRepository.findAllByParent([moduleId]);
                        return mapOfModuleIdsToOrigins;
                    }, {});

                    var getAllDataSetsUnderModule = function(moduleIdAndOrigins) {
                        var modulesAndAllDataSets = _.reduce(moduleIdAndOrigins, function(mapOfModuleIdsToDataSets, origins, moduleId) {
                            var firstOriginId = _.pluck(origins, "id")[0];
                            mapOfModuleIdsToDataSets[moduleId] = datasetRepository.findAllForOrgUnits([moduleId, firstOriginId]);
                            return mapOfModuleIdsToDataSets;
                        }, {});
                        return $q.all(modulesAndAllDataSets);
                    };

                    return $q.all(moduleIdsAndOrigins)
                        .then(getAllDataSetsUnderModule);
               };

                var filterPivotTablesForModules = function(datasetsByModule) {
                    var modulesAndPivotTables = [];
                    _.forEach(userModuleIds, function(userModuleId) {
                        var dataSetCodesForModule = _.pluck(datasetsByModule[userModuleId], "code");
                        _.forEach(pivotTables, function(pivotTable) {
                            _.forEach(dataSetCodesForModule, function(datasetCode) {
                                if (_.contains(pivotTable.name, datasetCode)) {
                                    modulesAndPivotTables.push({
                                        moduleId: userModuleId,
                                        pivotTable: pivotTable
                                    });
                                }
                            });
                        });
                    });
                    return $q.when(modulesAndPivotTables);
                };

                return getDatasetsRelevantToEachModule()
                    .then(filterPivotTablesForModules)
                    .then(recursivelyDownloadAndUpsertPivotTableData)
                    .then(function() {
                        if (!downloadOfAtLeastOneReportFailed) {
                            return updateChangeLog(changeLogKey);
                        }
                    });
            };

            return loadUserProjectsAndModuleIds().then(function(data) {
                var projectIds = data.usersProjectIds,
                    moduleIds = data.usersModuleIds,
                    changeLogKey = "pivotTableData:" + projectIds.join(';');

                if (_.isEmpty(moduleIds))
                    return;

                return changeLogRepository.get(changeLogKey).then(function(lastDownloadedTime) {
                    if (lastDownloadedTime && moment().isSame(lastDownloadedTime, 'day')) {
                        return;
                    }

                    return pivotTableRepository.getAll().then(function(pivotTables) {
                        return downloadRelevantPivotTableData(pivotTables, moduleIds, changeLogKey);
                    });
                });

            });
        };
    };
});
