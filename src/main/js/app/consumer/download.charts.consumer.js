define(["lodash"], function(_) {
    return function(chartService, chartRepository, userPreferenceRepository, datasetRepository, $q) {

        this.run = function(message) {

            var loadUserModuleIds = function() {
                return userPreferenceRepository.getUserModules().then(function(modules) {
                    return _.pluck(modules, "id");
                });
            };

            var loadRelevantDatasets = function(moduleIds) {
                return datasetRepository.findAllForOrgUnits(moduleIds);
            };

            var loadChartData = function(datasets) {
                return chartService.getAllFieldAppChartsForDataset(datasets);
            };

            var saveCharts = function(charts) {
                return chartRepository.upsert(charts).then(function(data) {
                    return charts;
                });
            };

            var saveChartData = function(userModuleIds, charts) {
                return _.forEach(userModuleIds, function(userModule) {
                    return _.forEach(charts, function(chart) {
                        return chartService.getChartDataForOrgUnit(chart, userModule).then(function(data) {
                            return chartRepository.upsertChartData(chart.name, userModule, data);
                        });
                    });
                });
            };

            return loadUserModuleIds().then(function(userModuleIds){
                if(_.isEmpty(userModuleIds))
                    return;

                loadRelevantDatasets(userModuleIds)
                    .then(loadChartData)
                    .then(saveCharts)
                    .then(_.partial(saveChartData, userModuleIds, _));
            });


        };
    };
});
