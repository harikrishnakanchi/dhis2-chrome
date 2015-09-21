define(["lodash"], function(_) {
    return function($scope, $q, $rootScope, userPreferenceRepository, chartRepository, orgUnitRepository) {

        var allCharts;
        $scope.allDataElementValues = [];
        $scope.weeks = [];
        $scope.noNotificationsForAnyModule = true;

        $scope.showTable = function(dataElementValues) {
            return _.any(dataElementValues, {
                "showInNotifications": true
            });
        };

        var getUserModules = function() {
            var isCoordinationLevelApprover = $rootScope.hasRoles(['Coordination Level Approver']);

            if (isCoordinationLevelApprover)
                return orgUnitRepository.getAllModulesInOrgUnits($rootScope.currentUser.selectedProject);

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
                $scope.weeks = _.slice(periods, periods.length - 5, periods.length - 1);
                return chartData;
            });
        };

        var findAverage = function(data) {
            var sum = data.reduce(function(sum, value) {
                return sum + value;
            }, 0);

            var avg = sum / data.length;
            return avg;
        };

        var calculateStandardDeviation = function(values) {
            var avg = findAverage(values);

            var squareDiffs = values.map(function(value) {
                var diff = value - avg;
                var sqrDiff = diff * diff;
                return sqrDiff;
            });

            var avgSquareDiff = findAverage(squareDiffs);

            var stdDev = Math.sqrt(avgSquareDiff);
            return stdDev * 1.25;
        };

        var getWeeklyData = function(dataElementData) {

            var getDataForCalculation = function(week) {
                var allData = [];
                dataElementData = _.sortBy(dataElementData, "1");

                var dataUptoGivenWeek = _.dropRightWhile(dataElementData, function(deData) {
                    return deData[1] !== week;
                });

                _.each(dataUptoGivenWeek, function(datum) {
                    allData.push(parseInt(datum[2]));
                });

                return allData;
            };

            return _.reduce($scope.weeks, function(result, week) {
                var dataForWeek = _.find(dataElementData, function(data) {
                    return data[1] === week;
                });

                if (!dataForWeek) {
                    result[week] = {
                        "value": "-",
                        "standardDeviation": undefined,
                        "mean": undefined,
                        "max": undefined
                    };
                    return result;
                }

                var dataForCalculation = getDataForCalculation(week);
                var standardDeviation = _.round(calculateStandardDeviation(dataForCalculation));
                var mean = _.round(findAverage(dataForCalculation));

                result[week] = {
                    "value": parseInt(dataForWeek[2]),
                    "standardDeviation": standardDeviation,
                    "mean": mean,
                    "max": _.round(mean + standardDeviation)
                };

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
            var dataElementValues = [];
            _.forEach(dataElementIds, function(dataElementId) {
                var dataElementRows = _.filter(chartData.rows, function(row) {
                    return row[0] === dataElementId;
                });
                // if (dataElementRows.length < 4)
                //     return;
                var weeklyData = getWeeklyData(dataElementRows);
                var showInNotifications = false;

                _.each(weeklyData, function(dataForWeek) {
                    if (dataForWeek.value > dataForWeek.max) {
                        showInNotifications = showInNotifications || true;
                        $scope.noNotificationsForAnyModule = false;
                    }

                });

                $scope.allDataElementValues.push({
                    "moduleName": module.parent.name + " - " + module.name,
                    "dataElementId": dataElementId,
                    "dataElementName": chartData.metaData.names[dataElementId],
                    "weeklyData": weeklyData,
                    "showInNotifications": showInNotifications
                });

            });
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
