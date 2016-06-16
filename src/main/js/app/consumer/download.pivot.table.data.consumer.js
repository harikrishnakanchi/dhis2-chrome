define(["lodash", "moment"], function(_, moment) {
    return function(reportService, pivotTableRepository, userPreferenceRepository, datasetRepository, changeLogRepository, orgUnitRepository, $q) {

        this.run = function(message) {
            var updateChangeLog = function(changeLogKey) {
                return changeLogRepository.upsert(changeLogKey, moment().toISOString());
            };

            var loadUserProjectsAndModuleIds = function() {
                return $q.all({
                    usersProjectIds: userPreferenceRepository.getCurrentUsersProjectIds(),
                    usersModuleIds: userPreferenceRepository.getCurrentUsersModules().then(function(modules) {
                        return _.pluck(modules, 'id');
                    })
                });
            };

            var downloadRelevantPivotTableData = function(pivotTables, projectIds, userModuleIds, changeLogKey) {
                var downloadOfAtLeastOneReportFailed = false;

                var recursivelyDownloadAndUpsertPivotTableData = function(orgUnitsAndTables) {
                    var onSuccess = function(data) {
                        return pivotTableRepository.upsertPivotTableData(datum.pivotTable.name, datum.orgUnitId, data).then(function() {
                            return recursivelyDownloadAndUpsertPivotTableData(orgUnitsAndTables);
                        });
                    };

                    var onFailure = function() {
                        downloadOfAtLeastOneReportFailed = true;
                        return recursivelyDownloadAndUpsertPivotTableData(orgUnitsAndTables);
                    };

                    if (_.isEmpty(orgUnitsAndTables))
                        return $q.when({});

                    var datum = orgUnitsAndTables.pop();
                    return reportService.getReportDataForOrgUnit(datum.pivotTable, datum.orgUnitId).then(onSuccess, onFailure);
                };

                var getDatasetsRelevantToEachModule = function() {
                    var moduleIdsAndOrigins = _.transform(userModuleIds, function(mapOfModuleIdsToOrigins, moduleId) {
                        mapOfModuleIdsToOrigins[moduleId] = orgUnitRepository.findAllByParent([moduleId]);
                    }, {});

                    var getAllDataSetsUnderModule = function(moduleIdAndOrigins) {
                        var modulesAndAllDataSets = _.transform(moduleIdAndOrigins, function(mapOfModuleIdsToDataSets, origins, moduleId) {
                            var orgUnitIds = [moduleId];
                            if(!_.isEmpty(origins)) {
                                orgUnitIds.push(_.first(origins).id);
                            }
                            mapOfModuleIdsToDataSets[moduleId] = datasetRepository.findAllForOrgUnits(orgUnitIds);
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
                                        orgUnitId: userModuleId,
                                        pivotTable: pivotTable
                                    });
                                }
                            });
                        });
                    });
                    return $q.when(modulesAndPivotTables);
                };

                var addProjectLevelPivotTables = function(orgUnitsAndTables){

                    _.forEach(projectIds, function(projectId) {
                        _.forEach(pivotTables, function(pivotTable) {
                            if(_.contains(pivotTable.name, "ProjectReport")) {
                                orgUnitsAndTables.push({
                                    orgUnitId: projectId,
                                    pivotTable: pivotTable
                                });
                            }
                        });
                    });

                    return $q.when(orgUnitsAndTables);
                };

                return getDatasetsRelevantToEachModule()
                    .then(filterPivotTablesForModules)
                    .then(addProjectLevelPivotTables)
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
                        return downloadRelevantPivotTableData(pivotTables, projectIds, moduleIds, changeLogKey);
                    });
                });

            });
        };
    };
});
