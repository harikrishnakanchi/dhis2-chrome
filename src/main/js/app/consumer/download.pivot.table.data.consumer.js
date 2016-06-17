define(["lodash", "moment"], function(_, moment) {
    return function(reportService, pivotTableRepository, userPreferenceRepository, datasetRepository, changeLogRepository, orgUnitRepository, $q) {

        this.run = function(message) {
            var updateChangeLog = function(changeLogKeys) {
                var upsertPromises = _.map(changeLogKeys, function(changeLogKey) {
                    return changeLogRepository.upsert(changeLogKey, moment().toISOString());
                });
                return $q.all(upsertPromises);
            };

            var downloadPivotTableDataForProject = function(pivotTables, projectId, userModuleIds) {
                var allDownloadsWereSuccessful = true;

                var recursivelyDownloadAndUpsertPivotTableData = function(orgUnitsAndTables) {
                    var onSuccess = function(data) {
                        return pivotTableRepository.upsertPivotTableData(datum.pivotTable.name, datum.orgUnitId, data).then(function() {
                            return recursivelyDownloadAndUpsertPivotTableData(orgUnitsAndTables);
                        });
                    };

                    var onFailure = function() {
                        allDownloadsWereSuccessful = false;
                        return recursivelyDownloadAndUpsertPivotTableData(orgUnitsAndTables);
                    };

                    if (_.isEmpty(orgUnitsAndTables))
                        return $q.when({});

                    var datum = orgUnitsAndTables.pop();
                    return reportService.getReportDataForOrgUnit(datum.pivotTable, datum.orgUnitId).then(onSuccess, onFailure);
                };

                var getDatasetsForEachModuleAndItsOrigins = function() {
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

                var filterPivotTablesForEachModule = function(datasetsByModule) {
                    var modulesAndPivotTables = [];

                    _.forEach(userModuleIds, function(moduleId) {
                        _.forEach(datasetsByModule[moduleId], function(dataSet) {
                            var pivotTablesForDataSet = _.filter(pivotTables, { dataSetCode: dataSet.code });
                            _.forEach(pivotTablesForDataSet, function(pivotTable) {
                                modulesAndPivotTables.push({
                                    orgUnitId: moduleId,
                                    pivotTable: pivotTable
                                });
                            });
                        });
                    });
                    return $q.when(modulesAndPivotTables);
                };

                var addProjectReportPivotTables = function(orgUnitsAndTables){
                    _.forEach(pivotTables, function(pivotTable) {
                        if(_.contains(pivotTable.name, "ProjectReport")) {
                            orgUnitsAndTables.push({
                                orgUnitId: projectId,
                                pivotTable: pivotTable
                            });
                        }
                    });

                    return $q.when(orgUnitsAndTables);
                };

                return getDatasetsForEachModuleAndItsOrigins()
                    .then(filterPivotTablesForEachModule)
                    .then(addProjectReportPivotTables)
                    .then(recursivelyDownloadAndUpsertPivotTableData)
                    .then(function() {
                        return $q.when(allDownloadsWereSuccessful);
                    });
            };

            var updatePivotTableDataForProject = function(projectId) {
                return orgUnitRepository.getAllModulesInOrgUnits([projectId]).then(function(modules) {
                    var moduleIds = _.pluck(modules, 'id'),
                        weeklyChangeLogKey = "weeklyPivotTableDataForProject:" + projectId,
                        monthlyChangeLogKey = "monthlyPivotTableDataForProject:" + projectId;

                    return $q.all({
                        weeklyReportsLastUpdated: changeLogRepository.get(weeklyChangeLogKey),
                        monthlyReportsLastUpdated: changeLogRepository.get(monthlyChangeLogKey)
                    }).then(function(data) {
                        var weeklyReportsLastUpdated = data.weeklyReportsLastUpdated,
                            monthlyReportsLastUpdated = data.monthlyReportsLastUpdated,
                            downloadWeeklyReports = !weeklyReportsLastUpdated || !moment().isSame(weeklyReportsLastUpdated, 'day'),
                            downloadMonthlyReports = !monthlyReportsLastUpdated || moment().diff(monthlyReportsLastUpdated, 'day') >= 7;

                        return pivotTableRepository.getAll().then(function(pivotTables) {
                            var pivotTablesToDownload = [],
                                changeLogKeysToUpdate = [];
                            if(downloadWeeklyReports) {
                                var weeklyReports = _.filter(pivotTables, { weeklyReport: true });
                                pivotTablesToDownload = pivotTablesToDownload.concat(weeklyReports);
                                changeLogKeysToUpdate.push(weeklyChangeLogKey);
                            }
                            if(downloadMonthlyReports) {
                                var monthlyReports = _.filter(pivotTables, { monthlyReport: true });
                                pivotTablesToDownload = pivotTablesToDownload.concat(monthlyReports);
                                changeLogKeysToUpdate.push(monthlyChangeLogKey);
                            }

                            return downloadPivotTableDataForProject(pivotTablesToDownload, projectId, moduleIds).then(function(allDownloadsWereSuccessful) {
                                if(allDownloadsWereSuccessful){
                                    return updateChangeLog(changeLogKeysToUpdate);
                                }
                            });
                        });
                    });
                });
            };

            var recursivelyLoopThroughProjects = function(projectIds) {
                if(_.isEmpty(projectIds)) {
                    return $q.when();
                }

                return updatePivotTableDataForProject(projectIds.pop()).then(function() {
                    return recursivelyLoopThroughProjects(projectIds);
                });
            };

            return userPreferenceRepository.getCurrentUsersProjectIds().then(recursivelyLoopThroughProjects);
        };
    };
});
