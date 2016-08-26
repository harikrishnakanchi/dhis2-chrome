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
                    return reportService.getReportDataForOrgUnit(datum.chart, datum.orgUnitDataDimensionItems).then(onSuccess, onFailure);
                };

                var getModuleInformation = function() {
                    var getOriginsForModule = function (data) {
                        return orgUnitRepository.findAllByParent(data.moduleId).then(function (origins) {
                            return _.merge({ origins: origins }, data);
                        });
                    };

                    var getDataSetsForModuleAndOrigins = function (data) {
                        var orgUnitIds = _.isEmpty(data.origins) ? [data.moduleId] : [data.moduleId, _.first(data.origins).id];
                        return datasetRepository.findAllForOrgUnits(orgUnitIds).then(function (dataSets) {
                            return _.merge({ dataSets: dataSets}, data);
                        });
                    };

                    var promises = _.transform(userModuleIds, function (promises, moduleId) {
                        promises[moduleId] = getOriginsForModule({ moduleId: moduleId}).then(getDataSetsForModuleAndOrigins);
                    }, {});
                    return $q.all(promises);
                };

                var filterChartsForModules = function(moduleInformation) {
                    var modulesAndCharts = [];
                    _.forEach(userModuleIds, function(moduleId) {
                        _.forEach(moduleInformation[moduleId].dataSets, function (dataSet) {
                            var filteredCharts = _.filter(charts, { dataSetCode: dataSet.code });
                            _.forEach(filteredCharts, function (chart) {
                                modulesAndCharts.push({
                                    moduleId: moduleId,
                                    chart: chart,
                                    orgUnitDataDimensionItems: moduleId
                                });
                            });
                        });
                    });
                    return $q.when(modulesAndCharts);
                };

                return getModuleInformation()
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
                    var isWeeklyChartDownloadedInSameDay = moment().isSame(data.weeklyChartsLastDownloaded, 'day');
                    var isMonthlyChartDownloadedInSameDay = moment().isSame(data.monthlyChartsLastDownloaded, 'day');
                    if (data.weeklyChartsLastDownloaded && isWeeklyChartDownloadedInSameDay) {
                        _.remove(charts, { weeklyChart: true });
                        _.pull(changeLogKeys, weeklyChangeLogKey);
                    }
                    if(data.monthlyChartsLastDownloaded && isMonthlyChartDownloadedInSameDay) {
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
