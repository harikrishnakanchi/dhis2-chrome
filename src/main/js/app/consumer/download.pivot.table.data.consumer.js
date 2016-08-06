define(["lodash", "moment"], function(_, moment) {
    return function(reportService, pivotTableRepository, userPreferenceRepository, datasetRepository, changeLogRepository, orgUnitRepository, $q) {

        this.run = function() {
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
                    return reportService.getReportDataForOrgUnit(datum.pivotTable, datum.orgUnitDimensionItems).then(onSuccess, onFailure);
                };

                var getModuleInformation = function() {
                    var getOriginsForModule = function (data) {
                        return orgUnitRepository.findAllByParent(data.moduleId).then(function (origins) {
                            return _.merge({ origins: origins }, data);
                        });
                    };

                    var getDataSetsForModuleAndOrigins = function (data) {
                        var orgUnitIds = [data.moduleId];
                        if(!_.isEmpty(data.origins)) {
                            orgUnitIds.push(_.first(data.origins).id);
                        }
                        return datasetRepository.findAllForOrgUnits(orgUnitIds).then(function (dataSets) {
                            return _.merge({ dataSets: dataSets }, data);
                        });
                    };

                    var moduleInfoPromises = _.transform(userModuleIds, function (promises, moduleId) {
                        promises[moduleId] = getOriginsForModule({ moduleId: moduleId }).then(getDataSetsForModuleAndOrigins);
                    }, {});

                    return $q.all(moduleInfoPromises);
               };

                var filterPivotTablesForEachModule = function(moduleInformation) {
                    var modulesAndPivotTables = [];

                    _.forEach(userModuleIds, function(moduleId) {
                        _.forEach(moduleInformation[moduleId].dataSets, function(dataSet) {
                            var pivotTablesForDataSet = _.filter(pivotTables, { dataSetCode: dataSet.code });
                            _.forEach(pivotTablesForDataSet, function(pivotTable) {
                                modulesAndPivotTables.push({
                                    orgUnitId: moduleId,
                                    pivotTable: pivotTable,
                                    orgUnitDimensionItems: pivotTable.geographicOriginReport ? _.map(moduleInformation[moduleId].origins, 'id') : moduleId
                                });
                            });
                        });
                    });
                    return $q.when(modulesAndPivotTables);
                };

                var addProjectReportPivotTables = function(orgUnitsAndTables){
                    var projectReportPivotTables = _.filter(pivotTables, { projectReport: true });

                    _.forEach(projectReportPivotTables, function(pivotTable) {
                        orgUnitsAndTables.push({
                            orgUnitId: projectId,
                            pivotTable: pivotTable,
                            orgUnitDimensionItems: projectId
                        });
                    });
                    return $q.when(orgUnitsAndTables);
                };

                return getModuleInformation()
                    .then(filterPivotTablesForEachModule)
                    .then(addProjectReportPivotTables)
                    .then(recursivelyDownloadAndUpsertPivotTableData)
                    .then(function() {
                        return $q.when(allDownloadsWereSuccessful);
                    });
            };

            var updateChangeLogs = function(changeLogKeys) {
                var upsertPromises = _.map(changeLogKeys, function(changeLogKey) {
                    return changeLogRepository.upsert(changeLogKey, moment().toISOString());
                });
                return $q.all(upsertPromises);
            };

            var applyDownloadFrequencyStrategy = function(projectId, pivotTables) {
                var weeklyChangeLogKey = "weeklyPivotTableData:" + projectId,
                    monthlyChangeLogKey = "monthlyPivotTableData:" + projectId,
                    changeLogKeys = [weeklyChangeLogKey, monthlyChangeLogKey];

                return $q.all({
                    weeklyReportsLastUpdated: changeLogRepository.get(weeklyChangeLogKey),
                    monthlyReportsLastUpdated: changeLogRepository.get(monthlyChangeLogKey)
                }).then(function(data) {
                    var isMonthlyReportDownloadedInSameDay = moment().isSame(data.monthlyReportsLastUpdated, 'day');
                    var isWeeklyReportDownloadedSameDay = moment().isSame(data.weeklyReportsLastUpdated, 'day');
                    if(data.weeklyReportsLastUpdated && isWeeklyReportDownloadedSameDay) {
                        _.remove(pivotTables, { weeklyReport: true });
                        _.pull(changeLogKeys, weeklyChangeLogKey);
                    }
                    if(data.monthlyReportsLastUpdated && isMonthlyReportDownloadedInSameDay) {
                        _.remove(pivotTables, { monthlyReport: true });
                        _.pull(changeLogKeys, monthlyChangeLogKey);
                    }

                    return $q.when({
                        pivotTables: pivotTables,
                        changeLogKeys: changeLogKeys
                    });
                });
            };

            var updatePivotTableDataForProject = function(projectId) {
                return $q.all({
                    modules: orgUnitRepository.getAllModulesInOrgUnits([projectId]),
                    pivotTables: pivotTableRepository.getAll()
                }).then(function (data) {
                    var moduleIds = _.pluck(data.modules, 'id');

                    return applyDownloadFrequencyStrategy(projectId, data.pivotTables).then(function(strategyResult) {
                        var pivotTablesToDownload = strategyResult.pivotTables,
                            changeLogKeysToUpdate = strategyResult.changeLogKeys;

                        return downloadPivotTableDataForProject(pivotTablesToDownload, projectId, moduleIds).then(function(allDownloadsWereSuccessful) {
                            if(allDownloadsWereSuccessful) {
                                return updateChangeLogs(changeLogKeysToUpdate);
                            }
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
