define(["d3", "lodash", "moment", "saveSvgAsPng"], function(d3, _, moment) {
    return function($scope, $q, $routeParams, datasetRepository, orgUnitRepository, chartRepository, pivotTableRepository, translationsService) {

        var formatYAxisTicks = function(datum) {
            var isFraction = function(x) { return x % 1 !== 0; };
            return isFraction(datum) ? '' : d3.format('.0f')(datum);
        };

        $scope.isReportOpen = false;

        $scope.barChartOptions = {
            "chart": {
                "type": "multiBarChart",
                "height": 450,
                "margin": {
                    "top": 20,
                    "right": 20,
                    "bottom": 60,
                    "left": 45
                },
                "clipEdge": true,
                "staggerLabels": false,
                "transitionDuration": 500,

                "x": function(d) {
                    return d.label;
                },
                "y": function(d) {
                    return d.value;
                },
                "xAxis": {
                    "axisLabel": "Period",
                    "tickFormat": function(d) {
                        return moment.unix(d).format('GGGG[W]W');
                    }
                },
                "yAxis": {
                    "tickFormat": formatYAxisTicks
                },
                "legend": {
                    "maxKeyLength": 50
                },
                "reduceXTicks": false
            }
        };

        $scope.stackedBarChartOptions = {
            "chart": {
                "type": "multiBarChart",
                "height": 450,
                "margin": {
                    "top": 20,
                    "right": 20,
                    "bottom": 60,
                    "left": 45
                },
                "stacked": true,
                "clipEdge": true,
                "staggerLabels": false,
                "transitionDuration": 500,
                "x": function(d) {
                    return d.label;
                },
                "y": function(d) {
                    return d.value;
                },
                "xAxis": {
                    "axisLabel": "Period",
                    "tickFormat": function(d) {
                        return moment.unix(d).format('GGGG[W]W');
                    }
                },
                "yAxis": {
                    "tickFormat": formatYAxisTicks
                },
                "legend": {
                    "maxKeyLength": 50
                },
                "reduceXTicks": false
            }
        };

        $scope.lineChartOptions = {
            "chart": {
                "type": "lineChart",
                "height": 450,
                "margin": {
                    "top": 20,
                    "right": 45,
                    "bottom": 60,
                    "left": 45
                },
                "useInteractiveGuideline": true,
                "x": function(d) {
                    return d.label;
                },
                "y": function(d) {
                    return d.value;
                },
                "xAxis": {
                    "axisLabel": "Period",
                    "tickFormat": function(d) {
                        return moment.unix(d).format('GGGG[W]W');
                    },
                    "tickValues": function(d) {
                        return _.pluck(d[0].values, 'label');
                    }
                },
                "yAxis": {
                    "tickFormat": formatYAxisTicks
                },
                "legend": {
                    "maxKeyLength": 50
                }
            }
        };

        $scope.isMonthlyPivotTablesAvailable = false;
        $scope.isWeeklyPivotTablesAvailable = false;

        $scope.resizeCharts = function() {
            window.dispatchEvent(new Event('resize'));
        };

        $scope.downloadChartAsPng = function(event) {
            saveSvgAsPng(event.currentTarget.parentElement.parentElement.getElementsByTagName("svg")[0], "chart.png");
        };

        var loadChartData = function() {

            var insertMissingPeriods = function(chartData, periodsForXAxis) {
                _.each(chartData, function(chartDataForKey) {
                    var periodsWithData = _.reduce(chartDataForKey.values, function(result, data) {
                        result.push(data.label);
                        return result;
                    }, []);

                    var missingPeriods = _.difference(periodsForXAxis, periodsWithData);
                    _.each(missingPeriods, function(period) {
                        chartDataForKey.values.push({
                            "label": period,
                            "value": 0
                        });
                    });
                    chartDataForKey.values = _.sortBy(chartDataForKey.values, function(value) {
                        return value.label;
                    });
                });

                return chartData;
            };

            var getChartData = function(charts) {

                var transform = function(chart, chartData) {
                    var getName = function(id) {
                        return chartData.metaData.names[id];
                    };

                    var periodsForXAxis = _.reduce(chartData.metaData.pe, function(result, period) {
                        result.push(parseInt(moment(period, 'GGGG[W]W').format('X')));
                        return result;
                    }, []);

                    var transformedChartData = _.transform(chartData.rows, function(result, row) {

                        var dimensionIndex = _.findIndex(chartData.headers, {
                            "name": "dx"
                        });

                        var dataElementsIds = chartData.metaData.dx;
                        _.each(dataElementsIds, function (id) {
                            var legendName = chartData.metaData.names[id];
                            chartData.metaData.names[id] = legendName.split(" - ")[0];
                        });

                        var categoryIndex = _.findIndex(chartData.headers, function(item) {
                            return item.name !== "dx" && item.name !== "pe" && item.name !== "value";
                        });
                        var chartDataKey = categoryIndex > -1 ? getName(row[categoryIndex]) : getName(row[dimensionIndex]);

                        var periodIndex = _.findIndex(chartData.headers, {
                            "name": "pe"
                        });
                        var chartDataPeriod = parseInt(moment(row[periodIndex], 'GGGG[W]W').format('X'));

                        var valueIndex = _.findIndex(chartData.headers, {
                            "name": "value"
                        });
                        var chartDataValue = parseInt(row[valueIndex]);

                        var existingItem = _.find(result, {
                            'key': chartDataKey
                        });

                        if (existingItem !== undefined) {
                            existingItem.values.push({
                                "label": chartDataPeriod,
                                "value": chartDataValue
                            });
                            return;
                        }

                        result.push({
                            "key": chartDataKey,
                            "values": [{
                                "label": chartDataPeriod,
                                "value": chartDataValue
                            }]
                        });
                    });

                    transformedChartData = insertMissingPeriods(transformedChartData, periodsForXAxis);

                    return {
                        "title": chart.title,
                        "dataSetCode": chart.dataSetCode,
                        "displayPosition": chart.displayPosition,
                        "type": chart.type,
                        "data": transformedChartData
                    };
                };

                charts = _.filter(charts, function(chart) {
                    return !_.endsWith(chart.name, "Notifications");
                });

                var getChartDataPromises = _.map(charts, function(chart) {
                    return chartRepository.getDataForChart(chart.name, $scope.orgUnit.id).then(function(chartData) {
                        if (!_.isEmpty(chartData))
                            return transform(chart, chartData);
                    });
                });

                return $q.all(getChartDataPromises);
            };

            return chartRepository.getAll()
                .then(getChartData)
                .then(function(chartData) {
                    $scope.chartData = chartData;
                });
        };

        var loadRelevantDatasets = function() {

            var loadDatasetsForModules = function(orgUnits) {
                return datasetRepository.findAllForOrgUnits(_.pluck(orgUnits, "id")).then(function(dataSets) {
                    var filteredDataSets = _.filter(dataSets, function(ds) {
                        return !(ds.isOriginDataset || ds.isPopulationDataset || ds.isReferralDataset);
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

            var isOfType = function(orgUnit, type) {
                return _.any(orgUnit.attributeValues, {
                    attribute: {
                        "code": "Type"
                    },
                    value: type
                });
            };

            return orgUnitRepository.get(orgUnitId).then(function(ou) {
                if (isOfType(ou, 'Module'))
                    ou.displayName = ou.parent.name + ' - ' + ou.name;
                $scope.orgUnit = ou;
            });
        };

        var transformTables = function(tables) {
            return $q.all(_.map(tables, function(tableDefinition) {
                return pivotTableRepository.getDataForPivotTable(tableDefinition.name, $routeParams.orgUnit).then(function(data) {
                    return {
                        definition: tableDefinition,
                        data: data,
                        dataSetCode: tableDefinition.dataSetCode,
                        isTableDataAvailable: !!(data && data.rows && data.rows.length > 0)
                    };
                });
            }));
        };

        var translatePivotTables = function (pivotTables) {
            return translationsService.translateReports(pivotTables);
        };

        var loadPivotTables = function() {
            return pivotTableRepository.getAll()
                .then(transformTables)
                .then(translatePivotTables)
                .then(function(pivotTables) {
                    $scope.pivotTables = pivotTables;
                });
        };

        var prepareDataForView = function() {
            _.each($scope.datasets, function(eachDataSet) {

                var filteredCharts = _.filter($scope.chartData, {
                    dataSetCode: eachDataSet.code
                });

                var filteredPivotTables = _.filter($scope.pivotTables, {
                    dataSetCode: eachDataSet.code
                });

                eachDataSet.isChartsAvailable = _.any(filteredCharts, function(chart) {
                    return chart.data && chart.data.length > 0;
                });

                eachDataSet.isWeeklyPivotTablesAvailable = _.any(filteredPivotTables, function(table) {
                    return table.definition.weeklyReport && table.isTableDataAvailable;
                });

                eachDataSet.isMonthlyPivotTablesAvailable = _.any(filteredPivotTables, function(table) {
                    return table.definition.monthlyReport && table.isTableDataAvailable;
                });

                eachDataSet.isReportsAvailable = eachDataSet.isChartsAvailable || eachDataSet.isMonthlyPivotTablesAvailable || eachDataSet.isWeeklyPivotTablesAvailable;
            });

            $scope.datasets = _.sortBy($scope.datasets, "name").reverse();
            $scope.datasets = _.sortBy($scope.datasets, "isReportsAvailable").reverse();

            if (!_.isEmpty($scope.datasets))
                $scope.selectedDataset = $scope.datasets[0];

            return $q.when();
        };

        var init = function() {
            $scope.loading = true;
            $scope.selectedDataset = null;
            loadOrgUnit()
                .then(loadRelevantDatasets)
                .then(loadChartData)
                .then(loadPivotTables)
                .then(prepareDataForView)
                .finally(function() {
                    $scope.loading = false;
                });
        };

        init();
    };
});
