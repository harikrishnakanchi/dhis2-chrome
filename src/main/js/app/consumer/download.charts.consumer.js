define([], function() {
    return function(chartService, chartRepository, orgUnitRepository, $q) {
        this.run = function(message) {
            var saveCharts = function(response) {
                var chartsDeferred = $q.defer();
                chartRepository.upsert(response.data.charts).then(function() {
                    chartsDeferred.resolve(response.data.charts);
                });
                return chartsDeferred.promise;
            };

            var saveChartData = function(charts) {
                var downloadDataForChart = function(modules) {
                    return function(chart) {
                        modules.forEach(function(module) {
                            chartService.getChartDataForOrgUnit(chart, module.id).then(function(data) {
                                chartRepository.upsertChartData(chart, module, data);
                            });
                        });
                    };
                };
                var allUnits = orgUnitRepository.getAllModules().then(function(allModules) {
                    charts.forEach(downloadDataForChart(allModules));
                });
            };
            chartService.getAllFieldAppCharts().then(saveCharts).then(saveChartData);
        };
    };
});