define(["d3", "lodash", "moment", "customAttributes", "saveSvgAsPng", "dataURItoBlob", "constants"], function(d3, _, moment, customAttributes, SVGUtils, dataURItoBlob, constants) {
    return function($rootScope, $scope, $q, $routeParams, datasetRepository, programRepository, orgUnitRepository, chartRepository, pivotTableRepository, translationsService, filesystemService, changeLogRepository, referralLocationsRepository) {

        var REPORTS_LAST_UPDATED_TIME_FORMAT = constants.TIME_FORMAT_12HR,
            REPORTS_LAST_UPDATED_TIME_24HR_FORMAT = constants.TIME_FORMAT_24HR;
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
            var svgElement = document.getElementById(chart.id).firstElementChild, lastUpdatedTimeDetails, chartTitle, chartTitleNode, transform;

            var setChartTitle = function () {
                transform = svgElement.firstElementChild.getAttribute('transform');
                var yAxisTransform = parseInt(transform.slice(transform.length - 3, transform.length - 1));
                var title = chart.title || "";
                chartTitle = document.createTextNode(title);

                chartTitleNode = document.createElement('text');
                chartTitleNode.setAttribute('x', '500');
                chartTitleNode.setAttribute('y', '15');
                chartTitleNode.setAttribute('text-anchor', 'middle');
                chartTitleNode.setAttribute('transform', 'translate(0, -' + (yAxisTransform + 20) + ')');
                chartTitleNode.setAttribute('style', 'font-size:15');

                chartTitleNode.insertBefore(chartTitle, chartTitleNode.childNodes[0]);
                svgElement.firstElementChild.setAttribute('transform', 'translate(45, ' + (yAxisTransform + 20) +')');
                svgElement.firstElementChild.insertBefore(chartTitleNode, svgElement.firstElementChild.childNodes[0]);
            };

            var removeChartTitle = function () {
                svgElement.firstElementChild.setAttribute('transform', transform);
                chartTitleNode.remove();
            };
            setChartTitle();

            var getPNGFileName = function() {
                if (lastUpdatedTime) {
                    lastUpdatedTimeDetails = '[updated ' + lastUpdatedTime + ']';
                }
                else {
                    lastUpdatedTimeDetails = moment().format("DD-MMM-YYYY");
                }
                return [chart.serviceCode, chart.title, lastUpdatedTimeDetails].join('.');
            };

            SVGUtils.svgAsPngUri(svgElement, {}, function(uri) {
                var blob = dataURItoBlob(uri);
                filesystemService.promptAndWriteFile(getPNGFileName(), blob, filesystemService.FILE_TYPE_OPTIONS.PNG);
                removeChartTitle();
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
                .then(translationsService.translate)
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
                        return ds.isPopulationDataset || ds.isLineListService;
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
                var orgUnitId = _.get(_.first(data.origins), 'id') || $scope.orgUnit.id;
                return programRepository.getProgramForOrgUnit(orgUnitId).then(function (program) {
                    var translatedProgram = translationsService.translate(program);
                    $scope.programServiceCode = program ? program.serviceCode : undefined;
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
                .then(translationsService.translate)
                .then(getPivotTableData)
                .then(translationsService.translatePivotTableData)
                .then(function(pivotTables) {
                    $scope.pivotTables = pivotTables;
                });
        };

        var filterServices = function () {
            //TODO can be removed after 12.0

            if($scope.orgUnit.lineListService) {
                var reports = $scope.pivotTables.concat($scope.charts);
                var serviceCodesWithReportData = _.uniq(_.map(reports, 'serviceCode'));
                var removeGeographicOriginFromServices = !_.contains(serviceCodesWithReportData, 'GeographicOrigin');
                var removeReferralLocationFromServices = !_.contains(serviceCodesWithReportData, 'ReferralLocation');
                if(removeGeographicOriginFromServices) {
                    $scope.services = _.reject($scope.services, function (service) {
                        return service.serviceCode === 'GeographicOrigin';
                    });
                }
                if(removeReferralLocationFromServices) {
                    $scope.services = _.reject($scope.services, function (service) {
                        return service.serviceCode === 'ReferralLocation';
                    });
                }
            }
        };

        var loadReferralLocationForModule = function () {
            return referralLocationsRepository.get($scope.orgUnit.parent.id).then(function (referralLocations) {
                $scope.referralLocations = referralLocations;
            });
        };

        var formatLastUpdatedTime = function (date) {
            var timeFormat = $scope.locale == 'fr' ? REPORTS_LAST_UPDATED_TIME_24HR_FORMAT : REPORTS_LAST_UPDATED_TIME_FORMAT;
            return date ? moment.utc(date).local().locale($scope.locale).format(timeFormat) : undefined;
        };

        var loadLastUpdatedForChartsAndReports = function () {
            var projectId = $rootScope.currentUser.selectedProject.id;
            return $q.all({
                weeklyChartsLastUpdated: changeLogRepository.get('weeklyChartData:' + projectId + ':' + $scope.orgUnit.id),
                weeklyPivotTableDataLastUpdated: changeLogRepository.get('weeklyPivotTableData:' + projectId + ':' + $scope.orgUnit.id),
                monthlyChartsLastUpdated: changeLogRepository.get('monthlyChartData:' + projectId + ':' + $scope.orgUnit.id),
                monthlyPivotTableLastUpdated: changeLogRepository.get('monthlyPivotTableData:' + projectId + ':' + $scope.orgUnit.id)
            }).then(function (data) {
                $scope.updatedForWeeklyChart = formatLastUpdatedTime(data.weeklyChartsLastUpdated);
                $scope.updatedForWeeklyPivotTable = formatLastUpdatedTime(data.weeklyPivotTableDataLastUpdated);
                $scope.updatedForMonthlyChart = formatLastUpdatedTime(data.monthlyChartsLastUpdated);
                $scope.updatedForMonthlyPivotTable = formatLastUpdatedTime(data.monthlyPivotTableLastUpdated);
            });
        };

        var countAvailableChartsAndReportsForServices = function () {
            var countByService = function (items) {
                return _.chain(items)
                    .groupBy('serviceCode')
                    .mapValues(_.property('length'))
                    .value();
            };

            var chartCountByService = countByService($scope.charts);
            var pivotTableCountByService = countByService($scope.pivotTables);

            _.each($scope.services, function (service) {
                service.areReportsAvailable = _.gt(_.add(
                        _.get(chartCountByService, service.serviceCode, 0),
                        _.get(pivotTableCountByService, service.serviceCode, 0)
                ), 0);
            });
        };

        var selectFirstServiceWithReports = function () {
            $scope.selectedService = _.find($scope.services, function (service) {
                return !service.isOriginDataset && !service.isReferralDataset && service.areReportsAvailable;
            });
        };

        $scope.setSelectedService = function (service) {
            $scope.selectedService = service;
        };

        var init = function() {
            $scope.startLoading();

            $scope.currentTab = 'weeklyReport';
            $scope.selectedService = null;

            loadOrgUnit()
                .then(loadServicesForOrgUnit)
                .then(loadChartsWithData)
                .then(loadPivotTablesWithData)
                .then(filterServices)
                .then(loadReferralLocationForModule)
                .then(loadLastUpdatedForChartsAndReports)
                .then(countAvailableChartsAndReportsForServices)
                .then(selectFirstServiceWithReports)
                .finally($scope.stopLoading);
        };

        init();
    };
});
