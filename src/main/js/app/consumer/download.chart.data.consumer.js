define(["lodash", "moment"], function(_, moment) {
    return function(reportService, chartRepository, userPreferenceRepository, datasetRepository, changeLogRepository, orgUnitRepository, $q) {

        this.run = function(message) {

            var getLastDownloadedTime = function(userProjectIds) {
                return changeLogRepository.get("charts:" + userProjectIds.join(';'));
            };

            var updateChangeLog = function(userProjectIds) {
                return changeLogRepository.clear("charts:").then(function() {
                    return changeLogRepository.upsert("charts:" + userProjectIds.join(';'), moment().toISOString());
                });
            };

            var loadUserProjectsAndModuleIds = function() {
                return $q.all([userPreferenceRepository.getCurrentProjects(), userPreferenceRepository.getUserModules(), userPreferenceRepository.getOriginOrgUnitIds()]);
            };

            var loadRelevantDatasets = function(orgUnitIds) {
                return datasetRepository.findAllForOrgUnits(orgUnitIds);
            };

            var downloadAndSaveChartData = function(userModuleIds, datasets, projectIds) {

                var saveCharts = function(charts) {
                    return chartRepository.replaceAll(charts).then(function(data) {
                        return charts;
                    });
                };

                var saveChartData = function(charts) {

                    var downloadOfAtLeastOneChartFailed = false;

                    var downloadAndUpsertChartData = function(modulesAndCharts) {
                        var onSuccess = function(data) {
                            return chartRepository.upsertChartData(datum[1].name, datum[0], data).then(function() {
                                return downloadAndUpsertChartData(modulesAndCharts);
                            });
                        };

                        var onFailure = function() {
                            downloadOfAtLeastOneChartFailed = true;
                            return downloadAndUpsertChartData(modulesAndCharts);
                        };

                        if (_.isEmpty(modulesAndCharts))
                            return $q.when({});

                        var datum = modulesAndCharts.pop();
                        return reportService.getReportDataForOrgUnit(datum[1], datum[0]).then(onSuccess, onFailure);
                    };

                    var getDatasetsByModule = function() {

                        var getAllDataSetsUnderModule = function(moduleIdAndOrigins) {
                            var modulesAndAllDataSets = _.reduce(moduleIdAndOrigins, function(mapOfModuleIdsToDataSets, origins, moduleId) {
                                var firstOriginId = _.pluck(origins, "id")[0];
                                mapOfModuleIdsToDataSets[moduleId] = loadRelevantDatasets([moduleId, firstOriginId]);
                                return mapOfModuleIdsToDataSets;
                            }, {});
                            return $q.all(modulesAndAllDataSets);
                        };

                        var moduleIdsAndOrigins = _.reduce(userModuleIds, function(mapOfModuleIdsToOrigins, moduleId) {
                            mapOfModuleIdsToOrigins[moduleId] = orgUnitRepository.findAllByParent([moduleId]);
                            return mapOfModuleIdsToOrigins;
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
                                        modulesAndCharts.push([userModuleId, chart]);
                                });
                            });
                        });
                        return $q.when(modulesAndCharts);
                    };

                    return getDatasetsByModule()
                        .then(filterChartsForModules)
                        .then(downloadAndUpsertChartData)
                        .then(function() {
                            if (!downloadOfAtLeastOneChartFailed) {
                                return updateChangeLog(projectIds);
                            }
                        });
                };

                return reportService.getCharts(datasets)
                    .then(saveCharts)
                    .then(saveChartData);
            };

            return loadUserProjectsAndModuleIds().then(function(data) {
                var projectIds = data[0];
                var moduleIds = _.pluck(data[1], "id");
                var originIds = data[2];

                if (_.isEmpty(moduleIds))
                    return;

                return getLastDownloadedTime(projectIds).then(function(lastDownloadedTime) {
                    if (lastDownloadedTime && !moment().isAfter(lastDownloadedTime, 'day')) {
                        return;
                    }
                    return loadRelevantDatasets(_.union(moduleIds, originIds)).then(function(datasets) {
                        return downloadAndSaveChartData(moduleIds, datasets, projectIds);
                    });
                });

            });
        };
    };
});
