define(["lodash"], function(_) {
    return function($scope, $q, $rootScope, userPreferenceRepository, chartRepository, orgUnitRepository, translationService) {

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
                return orgUnitRepository.getAllModulesInOrgUnits($rootScope.currentUser.selectedProject.id);

            return userPreferenceRepository.getCurrentUsersModules().then(function(modules) {
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
                if (chartData) {
                    var periods = chartData.metaData.pe;
                    $scope.weeks = _.slice(periods, periods.length - 5, periods.length - 1);
                    return chartData;
                }
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

        var getDataElementValues = function(chart, chartData, module) {
            if (_.isEmpty(chartData) || _.isEmpty(chartData.rows)) {
                return;
            }

            var dataElementIds = _.chain(chartData.rows).reduce(function(result, row) {
                result.push(row[0]);
                return result;
            }, []).uniq().value();

            _.forEach(dataElementIds, function(dataElementId) {
                var dataElementRows = _.filter(chartData.rows, function(row) {
                    return row[0] === dataElementId;
                });
                var weeklyData = getWeeklyData(dataElementRows);
                var showInNotifications = false;

                _.each(weeklyData, function(dataForWeek) {
                    if (dataForWeek.value > dataForWeek.max) {
                        showInNotifications = showInNotifications || true;
                        $scope.noNotificationsForAnyModule = false;
                    }

                });

                var dataElement;
                if(chart.columns) {
                    dataElement = _.find(chart.columns[0].items, function (item) {
                        return item.id == dataElementId;
                    });
                }

                $scope.allDataElementValues.push({
                    "moduleName": module.parent.name + " - " + module.name,
                    "dataElementId": dataElementId,
                    "dataElementName": translationService.getTranslationForProperty(dataElementId, 'name', chartData.metaData.names[dataElementId]),
                    "dataElementDescription": (dataElement && dataElement.description) ? dataElement.description : '',
                    "weeklyData": weeklyData,
                    "showInNotifications": showInNotifications
                });

            });
        };

        var getChartData = function(userModules) {
            var chartDataPromises = [];
            _.forEach(userModules, function(module) {
                _.forEach(allCharts, function(chart) {
                    var chartDataPromise = loadChartData(chart, module.id).then(function(chartData) {
                        getDataElementValues(chart, chartData, module);
                    });
                    chartDataPromises.push(chartDataPromise);
                });
            });
            return $q.all(chartDataPromises);
        };

        var init = function() {
            $scope.startLoading();
            return getAllCharts()
                .then(getUserModules)
                .then(orgUnitRepository.enrichWithParent)
                .then(getChartData)
                .then($scope.stopLoading);
        };

        init();

    };
});
