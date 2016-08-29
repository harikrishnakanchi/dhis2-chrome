define(["d3", "lodash", "moment", "customAttributes", "saveSvgAsPng", "dataURItoBlob"], function(d3, _, moment, CustomAttributes, SVGUtils, dataURItoBlob) {
    return function($rootScope, $scope, $q, $routeParams, datasetRepository, orgUnitRepository, chartRepository, pivotTableRepository, translationsService, filesystemService, changeLogRepository) {

        var REPORTS_LAST_UPDATED_TIME_FORMAT = "D MMMM[,] YYYY hh[.]mm A";
        var REPORTS_LAST_UPDATED_TIME_FORMAT_WITHOUT_COMMA = "D MMMM YYYY hh[.]mm A";

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
                return [chart.dataSetCode, chart.title, lastUpdatedTimeDetails, 'png'].join('.');
            };

            SVGUtils.svgAsPngUri(svgElement, {}, function(uri) {
                var blob = dataURItoBlob(uri);
                filesystemService.promptAndWriteFile(getPNGFileName(), blob, filesystemService.FILE_TYPE_OPTIONS.PNG);
            });
        };

        var filterReportsForCurrentModule = function (allReports) {
            var dataSetCodes = _.map($scope.datasets, 'code');
            return _.filter(allReports, function(report) {
                return _.contains(dataSetCodes, report.dataSetCode);
            });
        };

        var loadChartsWithData = function() {
            var filterOutNotificationCharts = function (charts) {
                return _.reject(charts, function(chart) {
                    return _.endsWith(chart.name, "Notifications");
                });
            };

            var getChartData = function(charts) {
                return $q.all(_.map(charts, function(chartDefinition) {
                    return chartRepository.getChartData(chartDefinition, $scope.orgUnit.id);
                }));
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
                .then(filterOutNotificationCharts)
                .then(getChartData)
                .then(translationsService.translateChartData)
                .then(transformForNVD3)
                .then(function(chartData) {
                    $scope.charts = chartData;
                });
        };

        var loadRelevantDatasets = function() {

            var loadDatasetsForModules = function(orgUnits) {
                return datasetRepository.findAllForOrgUnits(_.pluck(orgUnits, "id")).then(function(dataSets) {
                    var filteredDataSets = _.filter(dataSets, function(ds) {
                        return !(ds.isPopulationDataset || ds.isReferralDataset);
                    });
                    
                    var translatedDataSets = translationsService.translate(filteredDataSets);
                    $scope.datasets = translatedDataSets;
                });
            };

            var getOrigins = function(modules) {
                var moduleIds = _.pluck(modules, "id");
                return orgUnitRepository.findAllByParent(moduleIds, true).then(function(origins) {
                    return modules.concat(origins);
                });
            };

            return orgUnitRepository.getAllModulesInOrgUnits($scope.orgUnit.id).then(getOrigins)
                .then(loadDatasetsForModules);
        };

        var loadOrgUnit = function() {
            var orgUnitId = $routeParams.orgUnit;

            return orgUnitRepository.get(orgUnitId).then(function(orgUnit) {
                orgUnit.displayName = orgUnit.parent.name + ' - ' + orgUnit.name;
                orgUnit.lineListService = CustomAttributes.getBooleanAttributeValue(orgUnit.attributeValues, CustomAttributes.LINE_LIST_ATTRIBUTE_CODE);
                $scope.orgUnit = orgUnit;
            });
        };

        var getPivotTableData = function(tables) {
            return $q.all(_.map(tables, function(tableDefinition) {
                return pivotTableRepository.getPivotTableData(tableDefinition, $routeParams.orgUnit);
            }));
        };

        var loadPivotTablesWithData = function() {
            return pivotTableRepository.getAll()
                .then(filterReportsForCurrentModule)
                .then(getPivotTableData)
                .then(translationsService.translatePivotTableData)
                .then(function(pivotTables) {
                    $scope.pivotTables = pivotTables;
                });
        };

        var prepareDataForView = function() {
            _.each($scope.datasets, function(eachDataSet) {

                var filteredCharts = _.filter($scope.charts, { dataSetCode: eachDataSet.code });

                var filteredPivotTables = _.filter($scope.pivotTables, {
                    dataSetCode: eachDataSet.code
                });

                eachDataSet.isWeeklyChartsAvailable = _.any(filteredCharts, { weeklyChart: true, isDataAvailable: true });
                eachDataSet.isMonthlyChartsAvailable = _.any(filteredCharts, { monthlyChart: true, isDataAvailable: true });
                eachDataSet.isWeeklyPivotTablesAvailable = _.any(filteredPivotTables, { weeklyReport: true, isTableDataAvailable: true });
                eachDataSet.isMonthlyPivotTablesAvailable = _.any(filteredPivotTables, { monthlyReport: true, isTableDataAvailable: true });

                eachDataSet.isReportsAvailable = eachDataSet.isWeeklyChartsAvailable || eachDataSet.isMonthlyChartsAvailable || eachDataSet.isMonthlyPivotTablesAvailable || eachDataSet.isWeeklyPivotTablesAvailable;
            });
            
            $scope.datasets = _.sortByOrder($scope.datasets, ['name', 'isReportsAvailable'], ['asc' ,'desc']);

            $scope.selectedDataset = _.find($scope.datasets, { isOriginDataset: false, isReferralDataset: false });

            return $q.when();
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
            $scope.loading = true;

            $scope.currentTab = 'weeklyReport';
            $scope.selectedDataset = null;

            loadOrgUnit()
                .then(loadRelevantDatasets)
                .then(loadChartsWithData)
                .then(loadPivotTablesWithData)
                .then(loadLastUpdatedForChartsAndReports)
                .then(prepareDataForView)
                .finally(function() {
                    $scope.loading = false;
                });
        };

        init();
    };
});
