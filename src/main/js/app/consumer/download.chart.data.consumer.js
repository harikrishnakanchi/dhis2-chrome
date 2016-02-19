define(["lodash", "moment"], function(_, moment) {
    return function(reportService, chartRepository, userPreferenceRepository, datasetRepository, changeLogRepository, orgUnitRepository, $q) {

        this.run = function(message) {

            var updateChangeLog = function(changeLogKey) {
                return changeLogRepository.upsert(changeLogKey, moment().toISOString());
            };

            var loadUserProjectsAndModuleIds = function() {
                return $q.all({
                    usersProjectIds: userPreferenceRepository.getCurrentProjects(),
                    usersModuleIds: userPreferenceRepository.getUserModules().then(function(modules) {
                        return _.pluck(modules, 'id');
                    }),
                    usersOriginIds: userPreferenceRepository.getOriginOrgUnitIds()
                });
            };

            var loadRelevantDatasets = function(orgUnitIds) {
                return datasetRepository.findAllForOrgUnits(orgUnitIds);
            };

            var downloadRelevantChartData = function(charts, userModuleIds, datasets, changeLogKey) {
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
                            return updateChangeLog(changeLogKey);
                        }
                    });
            };

            return loadUserProjectsAndModuleIds().then(function(data) {
                var projectIds = data.usersProjectIds,
                    moduleIds = data.usersModuleIds,
                    originIds = data.usersOriginIds,
                    changeLogKey = "chartData:" + projectIds.join(';');

                if (_.isEmpty(moduleIds))
                    return;

                return changeLogRepository.get(changeLogKey).then(function(lastDownloadedTime) {
                    if (lastDownloadedTime && moment().isSame(lastDownloadedTime, 'day')) {
                        return;
                    }

                    return loadRelevantDatasets(_.union(moduleIds, originIds)).then(function(datasets) {
                        return chartRepository.getAll().then(function(charts) {
                            downloadRelevantChartData(charts, moduleIds, datasets, changeLogKey);
                        });
                    });
                });

            });
        };
    };
});
