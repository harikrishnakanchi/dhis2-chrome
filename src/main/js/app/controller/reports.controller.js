define(["d3", "lodash", "moment"], function(d3, _, moment) {
    return function($scope, $q, $routeParams, datasetRepository, orgUnitRepository, chartService) {

        $scope.margin = {
            "left": 20,
            "top": 50,
            "bottom": 100,
            "right": 20
        };

        $scope.yAxisTickFormatForInteger = function(d) {
            return d3.format(',f');
        };

        $scope.xAxisTickFormat = function(chart) {
            return function(d) {
                return moment(d).format('GGGG[W]WW');
            };
        };

        var loadChartData = function() {

            var getChartData = function(charts) {

                var transform = function(chart, chartData) {

                    var getName = function(id) {
                        return chartData.metaData.names[id];
                    };

                    var transformedChartData = _.transform(chartData.rows, function(result, row) {

                        var item = _.find(result, {
                            'key': getName(row[0])
                        });

                        if (item !== undefined) {
                            item.values.push([moment(row[1], 'GGGG[W]W').valueOf(), parseInt(row[2])]);
                            return;
                        }

                        result.push({
                            "key": getName(row[0]),
                            "values": [
                                [moment(row[1], 'GGGG[W]W').valueOf(), parseInt(row[2])]
                            ]
                        });
                    });

                    return {
                        "title": chart.title,
                        "dataset": chart.dataset,
                        "type": chart.type,
                        "data": transformedChartData
                    };
                };

                var getChartDataPromises = _.map(charts, function(chart) {
                    return chartService.getChartDataForOrgUnit(chart, $scope.orgUnit)
                        .then(_.curry(transform)(chart));
                });

                return $q.all(getChartDataPromises);
            };

            return chartService.getAllFieldAppCharts($scope.datasets)
                .then(getChartData)
                .then(function(chartData) {
                    $scope.chartData = chartData;
                });
        };

        var loadRelevantDatasets = function() {

            var loadDatasetsForModules = function(orgUnits) {
                return datasetRepository.findAllForOrgUnits(_.pluck(orgUnits, "id")).then(function(datasets) {
                    $scope.datasets = datasets;
                });
            };

            return orgUnitRepository.getAllModulesInOrgUnits($scope.orgUnit).then(loadDatasetsForModules);
        };


        var init = function() {
            $scope.orgUnit = $routeParams.orgUnit;

            loadRelevantDatasets()
                .then(loadChartData);
        };

        init();
    };
});
