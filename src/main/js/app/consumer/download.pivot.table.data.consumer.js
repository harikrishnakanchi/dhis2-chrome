define(["lodash", "moment", "constants"], function(_, moment, constants) {
    return function(reportService, systemInfoService, pivotTableRepository, userPreferenceRepository, datasetRepository, changeLogRepository, orgUnitRepository, programRepository, $q) {

        this.run = function() {
            var downloadPivotTableDataForProject = function(pivotTables, projectId, userModules) {
                var allDownloadsWereSuccessful = true;

                var recursivelyDownloadAndUpsertPivotTableData = function(orgUnitsAndTables) {
                    var onSuccess = function(data) {
                        return pivotTableRepository.upsertPivotTableData(datum.pivotTable.id, datum.orgUnitId, data).then(function() {
                            return recursivelyDownloadAndUpsertPivotTableData(orgUnitsAndTables);
                        });
                    };

                    var onFailure = function(response) {
                        allDownloadsWereSuccessful = false;
                        if (response && response.errorCode === constants.errorCodes.NETWORK_UNAVAILABLE) {
                            return $q.reject(response);
                        }
                        return recursivelyDownloadAndUpsertPivotTableData(orgUnitsAndTables);
                    };

                    if (_.isEmpty(orgUnitsAndTables))
                        return $q.when({});

                    var datum = orgUnitsAndTables.pop();
                    return reportService.getReportDataForOrgUnit(datum.pivotTable, datum.orgUnitDimensionItems).then(onSuccess, onFailure);
                };

                var getModuleInformation = function() {
                    var getOriginsForModule = function (data) {
                        return orgUnitRepository.findAllByParent(data.module.id).then(function (origins) {
                            return _.merge({ origins: origins }, data);
                        });
                    };

                    var getDataSetsForModuleAndOrigins = function (data) {
                        return datasetRepository.findAllForOrgUnits([data.module].concat(data.origins)).then(function (dataSets) {
                            return _.merge({ dataSets: dataSets }, data);
                        });
                    };

                    var getProgramForModule = function (data) {
                        var origin = _.first(data.origins);
                        return programRepository.getProgramForOrgUnit(_.get(origin, 'id')).then(function (program) {
                            return _.merge({ program: program }, data);
                        });
                    };

                    var moduleInfoPromises = _.transform(userModules, function (promises, module) {
                        promises[module.id] = getOriginsForModule({ module: module }).then(getDataSetsForModuleAndOrigins).then(getProgramForModule);
                    }, {});

                    return $q.all(moduleInfoPromises);
               };

                var filterPivotTablesForEachModule = function(moduleInformation) {
                    var modulesAndPivotTables = [];

                    _.forEach(userModules, function(module) {
                        var allServices = moduleInformation[module.id].dataSets.concat([moduleInformation[module.id].program]),
                            allServiceCodes = _.compact(_.map(allServices, 'serviceCode'));

                        _.forEach(allServiceCodes, function(serviceCode) {
                            var pivotTablesForService = _.filter(pivotTables, { serviceCode: serviceCode });
                            _.forEach(pivotTablesForService, function(pivotTable) {
                                modulesAndPivotTables.push({
                                    orgUnitId: module.id,
                                    pivotTable: pivotTable,
                                    orgUnitDimensionItems: pivotTable.geographicOriginReport ? _.map(moduleInformation[module.id].origins, 'id') : module.id
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

                var addOpUnitReportPivotTables = function (orgUnitsAndTables) {
                    return orgUnitRepository.getAllOpUnitsInOrgUnits([projectId]).then(function (opUnits) {
                        var opUnitIds = _.map(opUnits, 'id');
                        var opUnitReportPivotTables = _.filter(pivotTables, { opUnitReport: true });

                        _.forEach(opUnitReportPivotTables, function(pivotTable) {
                            _.forEach(opUnitIds, function (opUnitId) {
                                orgUnitsAndTables.push({
                                    orgUnitId: opUnitId,
                                    pivotTable: pivotTable,
                                    orgUnitDimensionItems: opUnitId
                                });
                            });
                        });
                        return $q.when(orgUnitsAndTables);
                    });
                };

                return getModuleInformation()
                    .then(filterPivotTablesForEachModule)
                    .then(addProjectReportPivotTables)
                    .then(addOpUnitReportPivotTables)
                    .then(recursivelyDownloadAndUpsertPivotTableData)
                    .then(function() {
                        return $q.when(allDownloadsWereSuccessful);
                    });
            };

            var updateChangeLogs = function(changeLogKeys, downloadStartTime) {
                var upsertPromises = _.map(changeLogKeys, function(changeLogKey) {
                    return changeLogRepository.upsert(changeLogKey, downloadStartTime);
                });
                return $q.all(upsertPromises);
            };

            var applyDownloadFrequencyStrategy = function(projectId, pivotTables) {
                var weeklyChangeLogKey = "weeklyPivotTableData:" + projectId,
                    monthlyChangeLogKey = "monthlyPivotTableData:" + projectId,
                    yearlyChangeLogKey = "yearlyPivotTableData:" + projectId,
                    changeLogKeys = [weeklyChangeLogKey, monthlyChangeLogKey, yearlyChangeLogKey];

                return $q.all({
                    weeklyReportsLastUpdated: changeLogRepository.get(weeklyChangeLogKey),
                    monthlyReportsLastUpdated: changeLogRepository.get(monthlyChangeLogKey),
                    yearlyReportsLastUpdated: changeLogRepository.get(yearlyChangeLogKey)
                }).then(function(data) {
                    var isMonthlyReportDownloadedInSameDay = moment.utc().isSame(data.monthlyReportsLastUpdated, 'day');
                    var isWeeklyReportDownloadedSameDay = moment.utc().isSame(data.weeklyReportsLastUpdated, 'day');
                    var isYearlyReportDownloadedSameWeek = moment.utc().isSame(data.yearlyReportsLastUpdated, 'isoWeek');
                    if(data.weeklyReportsLastUpdated && isWeeklyReportDownloadedSameDay) {
                        _.remove(pivotTables, { weeklyReport: true });
                        _.pull(changeLogKeys, weeklyChangeLogKey);
                    }
                    if(data.monthlyReportsLastUpdated && isMonthlyReportDownloadedInSameDay) {
                        _.remove(pivotTables, { monthlyReport: true });
                        _.pull(changeLogKeys, monthlyChangeLogKey);
                    }
                    if(data.yearlyReportsLastUpdated && isYearlyReportDownloadedSameWeek) {
                        _.remove(pivotTables, { yearlyReport: true });
                        _.pull(changeLogKeys, yearlyChangeLogKey);
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
                    pivotTables: pivotTableRepository.getAll(),
                    downloadStartTime: systemInfoService.getServerDate()
                }).then(function (data) {
                    return applyDownloadFrequencyStrategy(projectId, data.pivotTables).then(function(strategyResult) {
                        var pivotTablesToDownload = strategyResult.pivotTables,
                            changeLogKeysToUpdate = strategyResult.changeLogKeys;

                        return downloadPivotTableDataForProject(pivotTablesToDownload, projectId, data.modules).then(function(allDownloadsWereSuccessful) {
                            if(allDownloadsWereSuccessful) {
                                return updateChangeLogs(changeLogKeysToUpdate, data.downloadStartTime);
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
