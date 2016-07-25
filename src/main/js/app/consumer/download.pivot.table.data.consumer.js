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
                    var projectReportPivotTables = _.filter(pivotTables, { projectReport: true });

                    _.forEach(projectReportPivotTables, function(pivotTable) {
                        orgUnitsAndTables.push({
                            orgUnitId: projectId,
                            pivotTable: pivotTable
                        });
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
                    var isMonthlyReportDownloaded = function () {
                        var getWednesdayAsWeekStartsFromWednesday = function (date) {
                            var currentDay = date.day();
                            var WEDNESDAY = 3;
                            if (currentDay < WEDNESDAY) {
                                return date.subtract(1, 'week').startOf('week').add(3, 'days');
                            } else {
                                return date.startOf('week').add(3, 'days');
                            }
                        };
                        var lastDownloadedWednesday = getWednesdayAsWeekStartsFromWednesday(moment(data.monthlyReportsLastUpdated));
                        var currentWednesday = getWednesdayAsWeekStartsFromWednesday(moment());
                        var isMonthlyReportsDownloadedToday = moment().isSame(data.monthlyReportsLastUpdated, 'day');
                        var isCurrentDateInFirstTenDaysOfMonth = moment().date() <= 10;
                        return isCurrentDateInFirstTenDaysOfMonth ? isMonthlyReportsDownloadedToday :
                        isMonthlyReportsDownloadedToday || lastDownloadedWednesday.isSame(currentWednesday, 'day');
                    };

                    var isDownloadedSameDay = moment().isSame(data.weeklyReportsLastUpdated, 'day');
                    if(data.weeklyReportsLastUpdated && isDownloadedSameDay) {
                        _.remove(pivotTables, { weeklyReport: true });
                        _.pull(changeLogKeys, weeklyChangeLogKey);
                    }
                    if(data.monthlyReportsLastUpdated && isMonthlyReportDownloaded()) {
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
