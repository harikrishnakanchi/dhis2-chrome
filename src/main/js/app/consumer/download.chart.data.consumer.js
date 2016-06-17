define(["lodash", "moment"], function(_, moment) {
    return function(reportService, chartRepository, userPreferenceRepository, datasetRepository, changeLogRepository, orgUnitRepository, $q) {

        this.run = function() {
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
                var changeLogKey = "chartData:" + projectId;

                return changeLogRepository.get(changeLogKey).then(function(lastDownloadedTime) {
                    if (lastDownloadedTime && moment().isSame(lastDownloadedTime, 'day')) {
                        return $q.when({
                            charts: [],
                            changeLogKey: []
                        });
                    }
                    return $q.when({
                        charts: charts,
                        changeLogKey: changeLogKey
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
                            changeLogKeyToUpdate = strategyResult.changeLogKey;

                        return downloadRelevantChartData(chartsToDownload, moduleIds).then(function(allDownloadsWereSuccessful) {
                            if(allDownloadsWereSuccessful) {
                                return updateChangeLog(changeLogKeyToUpdate);
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
