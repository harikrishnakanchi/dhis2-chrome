define(["lodash", "moment"], function(_, moment) {
    return function(reportService, chartRepository, userPreferenceRepository, datasetRepository, changeLogRepository, $q) {

        this.run = function(message) {

            var getLastDownloadedTime = function(userProjectIds) {
                return changeLogRepository.get("charts:" + userProjectIds.join(';'));
            };

            var updateChangeLog = function(userProjectIds) {
                return changeLogRepository.upsert("charts:" + userProjectIds.join(';'), moment().toISOString());
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
                    var modulesAndCharts = [];
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

                    _.forEach(userModuleIds, function(userModule) {
                        _.forEach(charts, function(chart) {
                            modulesAndCharts.push([userModule, chart]);
                        });
                    });

                    return downloadAndUpsertChartData(modulesAndCharts).then(function() {
                        if (!downloadOfAtLeastOneChartFailed) {
                            return updateChangeLog(projectIds);
                        }
                    });
                };

                var removeDuplicateCharts = function(dhisCharts) {
                    return chartRepository.getAll().then(function(chartsFromDB) {
                        var duplicateIds = _.intersection(_.pluck(chartsFromDB, "id"), _.pluck(dhisCharts, "id"));
                        return chartRepository.deleteMultipleChartsById(duplicateIds, chartsFromDB).then(function() {
                            return dhisCharts;
                        });
                    });
                };

                return reportService.getCharts(datasets)
                    .then(removeDuplicateCharts)
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
