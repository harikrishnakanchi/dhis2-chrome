define(["lodash"], function(_) {
    return function($scope, $q, $rootScope, userPreferenceRepository, orgUnitRepository, translationService, pivotTableRepository, chartRepository, systemSettingRepository) {
        //TODO remove backward compatibility code one month after 10.0 release

        var notificationReports, standardDeviationValue;
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

        var getNotificationReports = function () {
            return pivotTableRepository.getPivotTablesForNotifications().then(function (pivotTables) {
                    notificationReports = pivotTables;
                if (pivotTables.length === 0) {
                    return chartRepository.getAllChartsForNotifications().then(function (charts) {
                        notificationReports = charts;
                    });
                }
            });
        };

        var loadReportData = function (report, moduleId) {
            return pivotTableRepository.getPivotTableData(report, moduleId, true).then(function (pivotTableData) {
                if (pivotTableData) { return pivotTableData; }
                else {
                    return chartRepository.getChartData(report, moduleId).then(function (chartData) {
                        if (chartData) { return chartData; }
                    });
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
            return stdDev * standardDeviationValue;
        };

        var getWeeklyData = function(periods, dataElement, reportData) {

            var getDataForCalculation = [];

            return _.reduce(periods, function(result, row) {
                var dataValueForWeek = reportData.getDataValue(row, dataElement);
                dataValueForWeek = _.isNumber(dataValueForWeek) ? parseInt(dataValueForWeek) : dataValueForWeek;

                if (_.isUndefined(dataValueForWeek)) {
                    result[row.name] = {
                        "value": "-",
                        "standardDeviation": undefined,
                        "mean": undefined,
                        "max": undefined
                    };
                    return result;
                }

                getDataForCalculation.push(dataValueForWeek);
                var standardDeviation = _.round(calculateStandardDeviation(getDataForCalculation));
                var mean = _.round(findAverage(getDataForCalculation));
                result[row.name] = {
                    "value": parseInt(dataValueForWeek),
                    "standardDeviation": standardDeviation,
                    "mean": mean,
                    "max": _.round(mean + standardDeviation)
                };

                return result;
            }, {});
        };

        var getDataElementValues = function(report, reportData, module) {
            if (_.isEmpty(reportData) || (_.isEmpty(reportData.rows) && _.isEmpty(reportData.columns) && _.isEmpty(reportData.categories) && _.isEmpty(reportData.series))) {
                return;
            }

            var getFromRows = function (dimension) {
                var rows = _.filter(reportData.rows, dimension);
                return rows.length ? rows : null;
            };

            var getFromColumns = function (dimension) {
                var columns = _.reduce(reportData.columns, function (result, column) {
                    return _.first(column)[dimension] ? result.concat(column) : result;
                }, []);
                return columns.length ? columns : null;
            };

            var getFromCategories = function (dimension) {
                var categories = _.filter(reportData.categories, dimension);
                return categories.length ? categories : null;
            };

            var getFromSeries = function (dimension) {
                var series = _.filter(reportData.series, dimension);
                return series.length ? series : null;
            };

            var periods = getFromRows('periodDimension') || getFromColumns('periodDimension') || getFromCategories('periodDimension') || getFromSeries('periodDimension');
            var dataElements = getFromRows('dataDimension') || getFromColumns('dataDimension') || getFromCategories('dataDimension') || getFromSeries('dataDimension');

            $scope.weeks = _.uniq(_.union($scope.weeks, _.slice(periods, periods.length - 5, periods.length - 1)), 'name');

            _.forEach(dataElements, function(dataElement) {
                var weeklyData = getWeeklyData($scope.weeks, dataElement, reportData);
                var showInNotifications = false;

                _.each(weeklyData, function(dataForWeek) {
                    if (dataForWeek.value > dataForWeek.max) {
                        showInNotifications = showInNotifications || true;
                        $scope.noNotificationsForAnyModule = false;
                    }
                });

                $scope.allDataElementValues.push({
                    "moduleName": module.parent.name + " - " + module.name,
                    "dataElementId": dataElement.id,
                    "dataElementName": translationService.getTranslationForProperty(dataElement, 'shortName', reportData.getDisplayName(dataElement)),
                    "dataElementDescription": translationService.getTranslationForProperty(dataElement, 'description', dataElement.description),
                    "weeklyData": weeklyData,
                    "showInNotifications": showInNotifications
                });

            });
        };

        var getStandardDeviationValue = function () {
            return systemSettingRepository.getStandardDeviationValue().then(function (value) {
                standardDeviationValue = value;
            });
        };

        var getReportData = function(userModules) {
            var reportDataPromises = [];
            _.forEach(userModules, function(module) {
                _.forEach(notificationReports, function(report) {
                    var reportDataPromise = loadReportData(report, module.id).then(function(reportData) {
                        getDataElementValues(report, reportData, module);
                    });
                    reportDataPromises.push(reportDataPromise);
                });
            });
            return $q.all(reportDataPromises);
        };

        var init = function() {
            $scope.startLoading();
            return getStandardDeviationValue()
                .then(getNotificationReports)
                .then(getUserModules)
                .then(orgUnitRepository.enrichWithParent)
                .then(getReportData)
                .then($scope.stopLoading);
        };

        init();

    };
});
