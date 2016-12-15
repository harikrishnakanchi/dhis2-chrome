define(["lodash"], function(_) {
    return function($scope, $q, $rootScope, userPreferenceRepository, chartRepository, orgUnitRepository, translationService, pivotTableRepository, systemSettingRepository) {

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
                if (pivotTables.length) {
                    notificationReports = pivotTables;
                } else {
                    return chartRepository.getAllChartsForNotifications().then(function (charts) {
                        notificationReports = charts;
                    });
                }
            });
        };

        var loadReportData = function(report, moduleId) {
            return chartRepository.getDataForChart(report.id, moduleId).then(function(reportData) {
                if (reportData) {
                    var periods = reportData.metaData.pe;
                    $scope.weeks = _.slice(periods, periods.length - 5, periods.length - 1);
                    return reportData;
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

        var getDataElementValues = function(report, reportData, module) {
            if (_.isEmpty(reportData) || _.isEmpty(reportData.rows)) {
                return;
            }

            var dataElementIds = _.chain(reportData.rows).reduce(function(result, row) {
                result.push(row[0]);
                return result;
            }, []).uniq().value();

            _.forEach(dataElementIds, function(dataElementId) {
                var dataElementRows = _.filter(reportData.rows, function(row) {
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
                if(report.columns) {
                    dataElement = _.find(report.columns[0].items, function (item) {
                        return item.id == dataElementId;
                    });
                }

                $scope.allDataElementValues.push({
                    "moduleName": module.parent.name + " - " + module.name,
                    "dataElementId": dataElementId,
                    "dataElementName": translationService.getTranslationForProperty(dataElementId, 'name', reportData.metaData.names[dataElementId]),
                    "dataElementDescription": (dataElement && dataElement.description) ? dataElement.description : '',
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
