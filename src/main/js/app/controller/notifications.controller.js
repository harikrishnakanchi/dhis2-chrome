define(["lodash"], function(_) {
    return function($scope, $q, userPreferenceRepository, chartRepository) {

        var allCharts;
        $scope.allDataElementValues = [];
        $scope.weeks = [];

        var getUserModules = function() {
            return userPreferenceRepository.getUserModules().then(function(modules) {
                return modules;
            });
        };

        var getAllCharts = function() {
            return chartRepository.getAllChartsForNotifications().then(function(charts) {
                allCharts = charts;
            });
        };

        var loadChartData = function(chart, moduleId) {
            return chartRepository.getDataForChart(chart.name, moduleId).then(function(chartData) {
                var periods = chartData.metaData.pe;
                $scope.weeks = _.slice(periods, periods.length - 4, periods.length);
                return chartData;
            });
        };

        var getWeeklyData = function(dataElementData) {
            return _.reduce($scope.weeks, function(result, week) {
                var dataForWeek = _.find(dataElementData, function(data) {
                    return data[1] === week;
                });
                result[week] = dataForWeek ? dataForWeek[2] : "-";
                return result;
            }, {});
        };

        var getDataElementValues = function(chartData, module) {
            if (_.isEmpty(chartData.rows)) {
                return;
            }

            var dataElementIds = _.reduce(chartData.rows, function(result, row) {
                result.push(row[0]);
                return _.uniq(result);
            }, []);

            _.forEach(dataElementIds, function(dataElementId) {
                var dataElementRows = _.filter(chartData.rows, function(row) {
                    return row[0] === dataElementId;
                });
                // if (dataElementRows.length < 4)
                //     return;
                $scope.allDataElementValues.push({
                    "moduleName": module.name,
                    "dataElementId": dataElementId,
                    "dataElementName": chartData.metaData.names[dataElementId],
                    "weeklyData": getWeeklyData(dataElementRows)
                });
            });
            return $scope.allDataElementValues;
        };

        var getChartData = function(userModules) {
            _.forEach(userModules, function(module) {
                _.forEach(allCharts, function(chart) {
                    loadChartData(chart, module.id).then(function(chartData) {
                        getDataElementValues(chartData, module);
                    });
                });
            });
        };

        var init = function() {
            return getAllCharts().then(getUserModules).then(getChartData);
        };

        init();

    };
});
