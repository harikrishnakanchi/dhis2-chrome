define(["lodash", "moment"], function(_, moment) {
    return function(reportService, chartRepository, userPreferenceRepository, datasetRepository, changeLogRepository, orgUnitRepository, $q) {

        this.run = function() {
            var updateChangeLogs = function(changeLogKeys) {
                var upsertPromises = _.map(changeLogKeys, function (changeLogKey) {
                    return changeLogRepository.upsert(changeLogKey, moment().toISOString());
                });
                return $q.all(upsertPromises);
            };

            var downloadRelevantChartData = function(charts, userModuleIds) {
                var allDownloadsWereSuccessful = true;

                var recursivelyDownloadAndUpsertChartData = function(modulesAndCharts) {
                    var onSuccess = function(data) {
                        return chartRepository.upsertChartData(datum.chart.name, datum.moduleId, data).then(function() {
                            return recursivelyDownloadAndUpsertChartData(modulesAndCharts);
                        });
                    };

                    var onFailure = function() {
                        allDownloadsWereSuccessful = false;
                        return recursivelyDownloadAndUpsertChartData(modulesAndCharts);
                    };

                    if (_.isEmpty(modulesAndCharts))
                        return $q.when({});

                    var datum = modulesAndCharts.pop();
                    return reportService.getReportDataForOrgUnit(datum.chart, datum.moduleId).then(onSuccess, onFailure);
                };

                var getDatasetsForEachModuleAndItsOrigins = function() {
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

                    var moduleIdsAndOrigins = _.transform(userModuleIds, function(mapOfModuleIdsToOrigins, moduleId) {
                        mapOfModuleIdsToOrigins[moduleId] = orgUnitRepository.findAllByParent([moduleId]);
                    }, {});

                    return $q.all(moduleIdsAndOrigins)
                        .then(getAllDataSetsUnderModule);
                };

                var filterChartsForModules = function(datasetsByModule) {
                    var modulesAndCharts = [];
                    _.forEach(userModuleIds, function(userModuleId) {
                        var dataSetCodesForModule = _.pluck(datasetsByModule[userModuleId], "code");
                        _.forEach(charts, function(chart) {
                            _.forEach(dataSetCodesForModule, function(datasetCode) {
                                if (_.contains(chart.name, datasetCode))
                                    modulesAndCharts.push({
                                        moduleId: userModuleId,
                                        chart: chart
                                    });
                            });
                        });
                    });
                    return $q.when(modulesAndCharts);
                };

                return getDatasetsForEachModuleAndItsOrigins()
                    .then(filterChartsForModules)
                    .then(recursivelyDownloadAndUpsertChartData)
                    .then(function() {
                        return $q.when(allDownloadsWereSuccessful);
                    });
            };

            var applyDownloadFrequencyStrategy = function(projectId, charts) {
                var weeklyChangeLogKey = "weeklyChartData:" + projectId,
                    monthlyChangeLogKey = "monthlyChartData:" + projectId,
                    changeLogKeys = [weeklyChangeLogKey, monthlyChangeLogKey];

                return $q.all({
                    weeklyChartsLastDownloaded: changeLogRepository.get(weeklyChangeLogKey),
                    monthlyChartsLastDownloaded: changeLogRepository.get(monthlyChangeLogKey)
                }).then(function(data) {
                    var isDownloadedInSameDay =  moment().isSame(data.weeklyChartsLastDownloaded, 'day');
                    var isDownloadedInSameWeekAndMonth = moment().isSame(data.monthlyChartsLastDownloaded, 'week') && moment().isSame(data.monthlyChartsLastDownloaded, 'month');
                    if (data.weeklyChartsLastDownloaded && isDownloadedInSameDay) {
                        _.remove(charts, { weeklyChart: true });
                        _.pull(changeLogKeys, weeklyChangeLogKey);
                    }
                    if(data.monthlyChartsLastDownloaded && isDownloadedInSameWeekAndMonth) {
                        _.remove(charts, { monthlyChart: true});
                        _.pull(changeLogKeys, monthlyChangeLogKey);
                    }
                    return $q.when({
                        charts: charts,
                        changeLogKeys: changeLogKeys
                    });
                });
            };

            var updateChartDataForProject = function(projectId) {
                return $q.all({
                    modules: orgUnitRepository.getAllModulesInOrgUnits([projectId]),
                    charts: chartRepository.getAll()
                }).then(function (data) {
                    var moduleIds = _.pluck(data.modules, 'id');

                    return applyDownloadFrequencyStrategy(projectId, data.charts).then(function(strategyResult) {
                        var chartsToDownload = strategyResult.charts,
                            changeLogKeysToUpdate = strategyResult.changeLogKeys;

                        return downloadRelevantChartData(chartsToDownload, moduleIds).then(function(allDownloadsWereSuccessful) {
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

                return updateChartDataForProject(projectIds.pop()).then(function() {
                    return recursivelyLoopThroughProjects(projectIds);
                });
            };

            return userPreferenceRepository.getCurrentUsersProjectIds().then(recursivelyLoopThroughProjects);
        };
    };
});
