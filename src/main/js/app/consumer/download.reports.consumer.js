define(["lodash", "moment"], function(_, moment) {
    return function(reportService, chartRepository, pivotTableRepository, userPreferenceRepository, datasetRepository, changeLogRepository, $q) {

        this.run = function(message) {

            var getLastDownloadedTime = function(userProjectIds) {
                return changeLogRepository.get("reports:" + userProjectIds.join(';'));
            };

            var updateChangeLog = function(userProjectIds) {
                return changeLogRepository.upsert("reports:" + userProjectIds.join(';'), moment().toISOString());
            };

            var loadUserProjectsAndModuleIds = function() {
                return userPreferenceRepository.getCurrentProjects().then(function(projectIds) {
                    return userPreferenceRepository.getUserModules().then(function(modules) {
                        originIds = _.reduce(modules, function(allChildren, module) {
                            allChildren.push(_.pluck(module.children, "id"));
                            allChildren = _.flatten(allChildren);
                            return allChildren;
                        }, []);
                        return [projectIds, _.pluck(modules, "id"), originIds];
                    });
                });
            };

            var loadRelevantDatasets = function(orgUnitIds) {
                return datasetRepository.findAllForOrgUnits(orgUnitIds);
            };

            var downloadAndSaveChartData = function(userModuleIds, datasets) {

                var saveCharts = function(charts) {
                    return chartRepository.upsert(charts).then(function(data) {
                        return charts;
                    });
                };

                var saveChartData = function(charts) {
                    var promises = [];
                    var modulesAndCharts = [];

                    var downloadAndUpsertReportData = function(modulesAndCharts) {
                        if (_.isEmpty(modulesAndCharts))
                            return $q.when({});

                        var datum = modulesAndCharts.pop();
                        return reportService.getReportDataForOrgUnit(datum[1], datum[0]).then(function(data) {
                            return chartRepository.upsertChartData(datum[1].name, datum[0], data).then(function() {
                                return downloadAndUpsertReportData(modulesAndCharts);
                            });
                        });
                    };

                    _.forEach(userModuleIds, function(userModule) {
                        _.forEach(charts, function(chart) {
                            modulesAndCharts.push([userModule, chart]);
                        });
                    });

                    return downloadAndUpsertReportData(modulesAndCharts);

                };

                return reportService.getCharts(datasets)
                    .then(saveCharts)
                    .then(saveChartData);
            };

            var downloadAndSavePivotTableData = function(userModuleIds, datasets) {

                var savePivotTables = function(pivotTables) {
                    return pivotTableRepository.upsert(pivotTables).then(function(data) {
                        return pivotTables;
                    });
                };

                var savePivotTableData = function(pivotTables) {
                    var promises = [];
                    var modulesAndTables = [];

                    var downloadAndUpsertReportData = function(modulesAndTables) {
                        if (_.isEmpty(modulesAndTables))
                            return $q.when({});

                        var datum = modulesAndTables.pop();
                        return reportService.getReportDataForOrgUnit(datum[1], datum[0]).then(function(data) {
                            return pivotTableRepository.upsertPivotTableData(datum[1].name, datum[0], data).then(function() {
                                return downloadAndUpsertReportData(modulesAndTables);
                            });
                        });
                    };

                    _.forEach(userModuleIds, function(userModule) {
                        _.forEach(pivotTables, function(pivotTable) {
                            modulesAndTables.push([userModule, pivotTable]);
                        });
                    });

                    return downloadAndUpsertReportData(modulesAndTables);

                };

                return reportService.getPivotTables(datasets)
                    .then(savePivotTables)
                    .then(savePivotTableData);
            };

            return loadUserProjectsAndModuleIds().then(function(data) {
                var projectIds = data[0];
                var moduleIds = data[1];
                var originIds = data[2];

                if (_.isEmpty(moduleIds))
                    return;

                return getLastDownloadedTime(projectIds).then(function(lastDownloadedTime) {
                    if (lastDownloadedTime && !moment().isAfter(lastDownloadedTime, 'day'))
                        return;
                    return loadRelevantDatasets(_.union(moduleIds, originIds)).then(function(datasets) {
                        return downloadAndSaveChartData(moduleIds, datasets)
                            .then(_.partial(downloadAndSavePivotTableData, moduleIds, datasets))
                            .then(_.partial(updateChangeLog, projectIds));
                    });
                });
            });
        };
    };
});
