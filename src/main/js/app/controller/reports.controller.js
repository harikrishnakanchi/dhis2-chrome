define(["d3", "lodash", "moment", "customAttributes", "saveSvgAsPng", "dataURItoBlob"], function(d3, _, moment, customAttributes, SVGUtils, dataURItoBlob) {
    return function($rootScope, $scope, $q, $routeParams, datasetRepository, programRepository, orgUnitRepository, chartRepository, pivotTableRepository, translationsService, filesystemService, changeLogRepository, referralLocationsRepository) {

        var REPORTS_LAST_UPDATED_TIME_FORMAT = "D MMMM[,] YYYY hh[.]mm A";
        var REPORTS_LAST_UPDATED_TIME_FORMAT_WITHOUT_COMMA = "D MMMM YYYY hh[.]mm A";
        var DEFAULT_SERVICE_CODE = 'noServiceCode';

        var NVD3_CHART_OPTIONS = {
            DEFAULT: {
                height: 450,
                margin: {top: 20, right: 20, bottom: 60, left: 45},
                x: function (d) {
                    return d.label;
                },
                y: function (d) {
                    return d.value;
                },
                legend: {maxKeyLength: 50}
            },
            WEEKLY: {
                xAxis: {
                    axisLabel: $scope.resourceBundle.xAxisLabel,
                    tickFormat: function (d) {
                        return moment.unix(d).format('GGGG[W]W');
                    }
                }
            },
            MONTHLY: {
                xAxis: {
                    axisLabel: $scope.resourceBundle.xAxisLabel,
                    tickFormat: function (d) {
                        return moment.localeData($scope.locale).monthsShort(moment.unix(d)) + ' ' + moment.unix(d).format('YY');
                    }
                }
            },
            COLUMN: {
                type: 'multiBarChart',
                clipEdge: true,
                staggerLabels: false,
                transitionDuration: 500,
                reduceXTicks: false,
                controlLabels: {
                    grouped: $scope.resourceBundle.grouped,
                    stacked: $scope.resourceBundle.stacked
                },
                yAxis: {
                    tickFormat: function(datum) {
                        var isFraction = function(x) { return x % 1 !== 0; };
                        return isFraction(datum) ? '' : d3.format('.0f')(datum);
                    }
                }
            },
            STACKED_COLUMN: {
                type: 'multiBarChart',
                clipEdge: true,
                staggerLabels: false,
                transitionDuration: 500,
                reduceXTicks: false,
                stacked: true,
                controlLabels: {
                    grouped: $scope.resourceBundle.grouped,
                    stacked: $scope.resourceBundle.stacked
                },
                yAxis: {
                    tickFormat: function(datum) {
                        var isFraction = function(x) { return x % 1 !== 0; };
                        return isFraction(datum) ? '' : d3.format('.0f')(datum);
                    }
                }
            },
            LINE: {
                type: 'lineChart',
                useInteractiveGuideline: true,
                xAxis: {
                    tickValues: function(d) {
                        return _.pluck(d[0].values, 'label');
                    }
                }
            }
        };

        $scope.downloadChartAsPng = function(chart, lastUpdatedTime) {
            var svgElement = document.getElementById(chart.id).firstElementChild, lastUpdatedTimeDetails;

            var getPNGFileName = function() {
                if (lastUpdatedTime) {
                    var formattedDate = moment(lastUpdatedTime, REPORTS_LAST_UPDATED_TIME_FORMAT).format(REPORTS_LAST_UPDATED_TIME_FORMAT_WITHOUT_COMMA);
                    lastUpdatedTimeDetails = '[updated ' + formattedDate + ']';
                }
                else {
                    lastUpdatedTimeDetails = moment().format("DD-MMM-YYYY");
                }
                return [chart.serviceCode, chart.title, lastUpdatedTimeDetails].join('.');
            };

            SVGUtils.svgAsPngUri(svgElement, {}, function(uri) {
                var blob = dataURItoBlob(uri);
                filesystemService.promptAndWriteFile(getPNGFileName(), blob, filesystemService.FILE_TYPE_OPTIONS.PNG);
            });
        };

        var filterReportsForCurrentModule = function (allReports) {
            var serviceCodes = _.map($scope.services, 'serviceCode');
            return _.filter(allReports, function(report) {
                return _.contains(serviceCodes, report.serviceCode);
            });
        };

        var rejectNotificationReports = function (reportsForCurrentModule) {
            return _.reject(reportsForCurrentModule, function (report) {
                return _.endsWith(report.name, 'Notifications');
            });
        };

        var loadChartsWithData = function() {
            var getChartData = function(charts) {
                var promises = _.map(charts, function(chart) {
                    return chartRepository.getChartData(chart, $scope.orgUnit.id);
                });

                return $q.all(promises).then(function (charts) {
                    return _.filter(charts, 'isDataAvailable');
                });
            };

            var transformForNVD3 = function (charts) {
                var getUnixTimestamp = function (chart, periodId) {
                    return moment(periodId, chart.weeklyChart ? 'GGGG[W]W' : 'YYYYMM').unix();
                };

                return _.map(charts, function (chart) {
                    var chartIsPeriodBased =  _.first(chart.categories).periodDimension;
                    chart.nvd3Options = {
                        chart: _.merge(
                            {},
                            NVD3_CHART_OPTIONS.DEFAULT,
                            NVD3_CHART_OPTIONS[chart.type],
                            chartIsPeriodBased ? (chart.weeklyChart ? NVD3_CHART_OPTIONS.WEEKLY : NVD3_CHART_OPTIONS.MONTHLY) : {}
                        )
                    };
                    chart.nvd3Data = _.map(chart.series, function (series) {
                        return {
                            key: chart.getDisplayName(series),
                            values: _.map(chart.categories, function (category) {
                                return {
                                    label: category.periodDimension ? getUnixTimestamp(chart,category.id) : chart.getDisplayName(category),
                                    value: chart.getDataValue(series, category) || 0
                                };
                            })
                        };
                    });
                    return chart;
                });
            };

            return chartRepository.getAll()
                .then(filterReportsForCurrentModule)
                .then(rejectNotificationReports)
                .then(getChartData)
                .then(translationsService.translateChartData)
                .then(transformForNVD3)
                .then(function(chartData) {
                    $scope.charts = chartData;
                });
        };

        var loadServicesForOrgUnit = function() {

            var loadDataSetsForModules = function(data) {
                var modulesAndOrigins = data.modules.concat(data.origins);

                return datasetRepository.findAllForOrgUnits(modulesAndOrigins).then(function(dataSets) {
                    var filteredDataSets = _.reject(dataSets, function(ds) {
                        return ds.isPopulationDataset || ds.isReferralDataset || ds.isLineListService;
                    });
                    
                    var translatedDataSets = translationsService.translate(filteredDataSets);
                    return _.merge({ dataSets: translatedDataSets }, data);
                });
            };

            var getOrigins = function(modules) {
                var moduleIds = _.map(modules, 'id');
                return orgUnitRepository.findAllByParent(moduleIds, true).then(function(origins) {
                    return {
                        modules: modules,
                        origins: origins
                    };
                });
            };

            var loadProgramForOrigins = function (data) {
                var oneOriginId = _.get(_.first(data.origins), 'id');
                return programRepository.getProgramForOrgUnit(oneOriginId).then(function (program) {
                    var translatedProgram = translationsService.translate(program);
                    $scope.services = _.compact(data.dataSets.concat([translatedProgram]));
                });
            };

            var setDefaultServiceCode = function () {
                return _.map($scope.services, function (service) {
                    return service.serviceCode ? service : _.set(service, 'serviceCode', DEFAULT_SERVICE_CODE);
                });
            };

            var sortServices = function () {
                $scope.services = _.sortByOrder($scope.services, 'name');
            };

            return orgUnitRepository.getAllModulesInOrgUnits($scope.orgUnit.id)
                .then(getOrigins)
                .then(loadDataSetsForModules)
                .then(loadProgramForOrigins)
                .then(setDefaultServiceCode)
                .then(sortServices);
        };

        var loadOrgUnit = function() {
            var orgUnitId = $routeParams.orgUnit;

            return orgUnitRepository.get(orgUnitId)
                .then(orgUnitRepository.enrichWithParent)
                .then(function(orgUnit) {
                orgUnit.displayName = orgUnit.parent.name + ' - ' + orgUnit.name;
                orgUnit.lineListService = customAttributes.getBooleanAttributeValue(orgUnit.attributeValues, customAttributes.LINE_LIST_ATTRIBUTE_CODE);
                $scope.orgUnit = orgUnit;
            });
        };

        var getPivotTableData = function(pivotTables) {
            var promises = _.map(pivotTables, function(pivotTable) {
                return pivotTableRepository.getPivotTableData(pivotTable, $routeParams.orgUnit);
            });

            return $q.all(promises).then(function (pivotTableData) {
                return _.filter(pivotTableData, 'isDataAvailable');
            });
        };

        var loadPivotTablesWithData = function() {
            return pivotTableRepository.getAll()
                .then(filterReportsForCurrentModule)
                .then(rejectNotificationReports)
                .then(getPivotTableData)
                .then(translationsService.translatePivotTableData)
                .then(function(pivotTables) {
                    $scope.pivotTables = pivotTables;
                });
        };

        var loadReferralLocationForModule = function () {
            return referralLocationsRepository.get($scope.orgUnit.parent.id).then(function (referralLocations) {
                $scope.referralLocations = referralLocations;
            });
        };

        var loadLastUpdatedForChartsAndReports = function () {
            var formatlastUpdatedTime = function (date) {
                return date ? moment(date).format(REPORTS_LAST_UPDATED_TIME_FORMAT) : undefined;
            };
            var projectId = $rootScope.currentUser.selectedProject.id;
            return $q.all({
                monthlyChartsLastUpdated: changeLogRepository.get('monthlyChartData:' + projectId),
                weeklyChartsLastUpdated: changeLogRepository.get('weeklyChartData:' + projectId),
                monthlyPivotTableLastUpdated: changeLogRepository.get('monthlyPivotTableData:' + projectId),
                weeklyPivotTableDataLastUpdated: changeLogRepository.get('weeklyPivotTableData:' + projectId)
            }).then(function (data) {
                $scope.updatedForWeeklyChart = formatlastUpdatedTime(data.weeklyChartsLastUpdated);
                $scope.updatedForWeeklyPivotTable = formatlastUpdatedTime(data.weeklyPivotTableDataLastUpdated);
                $scope.updatedForMonthlyChart = formatlastUpdatedTime(data.monthlyChartsLastUpdated);
                $scope.updatedForMonthlyPivotTable = formatlastUpdatedTime(data.monthlyPivotTableLastUpdated);
            });
        };

        var init = function() {
            $scope.startLoading();

            $scope.currentTab = 'weeklyReport';
            $scope.selectedService = null;

            loadOrgUnit()
                .then(loadServicesForOrgUnit)
                .then(loadChartsWithData)
                .then(loadPivotTablesWithData)
                .then(loadReferralLocationForModule)
                .then(loadLastUpdatedForChartsAndReports)
                .finally(function() {
                    $scope.selectedService = _.find($scope.services, function (service) {
                        return !service.isOriginDataset;
                    });
                    $scope.stopLoading();
                });
        };

        init();
    };
});
