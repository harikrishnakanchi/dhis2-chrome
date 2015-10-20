define(["lodash"], function(_) {
    return function(reportService, chartRepository, pivotTableRepository, userPreferenceRepository, datasetRepository, $q) {

        this.run = function(message) {

            var loadUserModuleIds = function() {
                return userPreferenceRepository.getUserModules().then(function(modules) {
                    return _.pluck(modules, "id");
                });
            };

            var loadRelevantDatasets = function(userModuleIds) {
                return datasetRepository.findAllForOrgUnits(userModuleIds);
            };

            var loadChartData = function(userModuleIds, datasets) {

                var saveCharts = function(charts) {
                    return chartRepository.upsert(charts).then(function(data) {
                        return charts;
                    });
                };

                var saveChartData = function(charts) {
                    return _.forEach(userModuleIds, function(userModule) {
                        return _.forEach(charts, function(chart) {
                            return reportService.getReportDataForOrgUnit(chart, userModule).then(function(data) {
                                return chartRepository.upsertChartData(chart.name, userModule, data);
                            });
                        });
                    });
                };

                return reportService.getCharts(datasets)
                    .then(saveCharts)
                    .then(saveChartData);
            };

            var loadPivotTableData = function(userModuleIds, datasets) {

                var savePivotTables = function(pivotTables) {
                    return pivotTableRepository.upsert(pivotTables).then(function(data) {
                        return pivotTables;
                    });
                };

                var savePivotTableData = function(pivotTables) {
                    return _.forEach(userModuleIds, function(userModule) {
                        return _.forEach(pivotTables, function(pivotTable) {
                            return reportService.getReportDataForOrgUnit(pivotTable, userModule).then(function(data) {
                                return pivotTableRepository.upsertPivotTableData(pivotTable.name, userModule, data);
                            });
                        });
                    });
                };

                return reportService.getPivotTables(datasets)
                    .then(savePivotTables)
                    .then(savePivotTableData);
            };

            return loadUserModuleIds().then(function(userModuleIds) {
                if (_.isEmpty(userModuleIds))
                    return;

                return loadRelevantDatasets(userModuleIds).then(function(datasets) {
                    return $q.all([loadChartData(userModuleIds, datasets), loadPivotTableData(userModuleIds, datasets)]);
                });
            });


        };
    };
});
