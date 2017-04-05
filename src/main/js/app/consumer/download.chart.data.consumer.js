define(["lodash", "moment", "constants"], function(_, moment, constants) {
    return function(reportService, systemInfoService, chartRepository, userPreferenceRepository, datasetRepository, changeLogRepository, orgUnitRepository, programRepository, $q) {

        this.run = function() {
            var downloadStartTime;

            var updateChangeLogs = function(changeLogKeys) {
                var upsertPromises = _.map(changeLogKeys, function (changeLogKey) {
                    return changeLogRepository.upsert(changeLogKey, downloadStartTime);
                });
                return $q.all(upsertPromises);
            };

            var downloadRelevantChartDataForModule = function (module, charts, projectId) {
                var allDownloadsWereSuccessful = true;

                var recursivelyDownloadAndUpsertChartData = function(modulesAndCharts) {
                    var onSuccess = function(data) {
                        return chartRepository.upsertChartData(datum.chart.id, datum.moduleId, data).then(function() {
                            return recursivelyDownloadAndUpsertChartData(modulesAndCharts);
                        });
                    };

                    var onFailure = function(response) {
                        allDownloadsWereSuccessful = false;
                        if(response && response.errorCode === constants.errorCodes.NETWORK_UNAVAILABLE) {
                            return $q.reject();
                        }
                        return recursivelyDownloadAndUpsertChartData(modulesAndCharts);
                    };

                    if (_.isEmpty(modulesAndCharts))
                        return $q.when({});

                    var datum = modulesAndCharts.pop();
                    return reportService.getReportDataForOrgUnit(datum.chart, datum.orgUnitDataDimensionItems).then(onSuccess, onFailure);
                };

                var getModuleInformation = function() {
                    var getOriginsForModule = function (data) {
                        return orgUnitRepository.findAllByParent(module.id).then(function (origins) {
                            return _.merge({ origins: origins }, data);
                        });
                    };

                    var getDataSetsForModuleAndOrigins = function (data) {
                        var orgUnits = [data.module].concat(data.origins);
                        return datasetRepository.findAllForOrgUnits(orgUnits).then(function (dataSets) {
                            return _.merge({ dataSets: dataSets}, data);
                        });
                    };

                    var getProgramForModule = function (data) {
                        var origin = _.first(data.origins);
                        return programRepository.getProgramForOrgUnit(_.get(origin, 'id')).then(function (program) {
                            return _.merge({ program: program }, data);
                        });
                    };

                    return getOriginsForModule({module: module}).then(getDataSetsForModuleAndOrigins).then(getProgramForModule);
                };

                var filterChartsForModules = function(moduleInformation, charts) {
                    var modulesAndCharts = [];
                    var allServices = moduleInformation.dataSets.concat([moduleInformation.program]),
                        allServiceCodes = _.compact(_.map(allServices, 'serviceCode'));

                    _.forEach(allServiceCodes, function (serviceCode) {
                        var filteredCharts = _.filter(charts, { serviceCode: serviceCode });
                        _.forEach(filteredCharts, function (chart) {
                            modulesAndCharts.push({
                                moduleId: moduleInformation.module.id,
                                chart: chart,
                                orgUnitDataDimensionItems: chart.geographicOriginChart ? _.map(moduleInformation.origins, 'id') : moduleInformation.module.id
                            });
                        });
                    });
                    return $q.when(modulesAndCharts);
                };

                var applyDownloadFrequencyStrategy = function() {
                    var weeklyChangeLogKey = "weeklyChartData:" + projectId + ':' + module.id,
                        monthlyChangeLogKey = "monthlyChartData:" + projectId + ':' + module.id,
                        yearlyChangeLogKey = "yearlyChartData:" + projectId + ':' + module.id,
                        changeLogKeys = [weeklyChangeLogKey, monthlyChangeLogKey, yearlyChangeLogKey];

                    return $q.all({
                        weeklyChartsLastDownloaded: changeLogRepository.get(weeklyChangeLogKey),
                        monthlyChartsLastDownloaded: changeLogRepository.get(monthlyChangeLogKey),
                        yearlyChartsLastDownloaded: changeLogRepository.get(yearlyChangeLogKey)
                    }).then(function(data) {
                        var isWeeklyChartDownloadedInSameDay = moment.utc().isSame(data.weeklyChartsLastDownloaded, 'day');
                        var isMonthlyChartDownloadedInSameDay = moment.utc().isSame(data.monthlyChartsLastDownloaded, 'day');
                        var isYearlyChartDownloadedInSameWeek = moment.utc().isSame(data.yearlyChartsLastDownloaded, 'isoWeek');
                        if (data.weeklyChartsLastDownloaded && isWeeklyChartDownloadedInSameDay) {
                            _.remove(charts, { weeklyChart: true });
                            _.pull(changeLogKeys, weeklyChangeLogKey);
                        }
                        if(data.monthlyChartsLastDownloaded && isMonthlyChartDownloadedInSameDay) {
                            _.remove(charts, { monthlyChart: true});
                            _.pull(changeLogKeys, monthlyChangeLogKey);
                        }
                        if(data.yearlyChartsLastDownloaded && isYearlyChartDownloadedInSameWeek) {
                            _.remove(charts, { yearlyChart: true});
                            _.pull(changeLogKeys, yearlyChangeLogKey);
                        }
                        return $q.when({
                            charts: charts,
                            changeLogKeys: changeLogKeys
                        });
                    });
                };

                return $q.all({
                    strategyResult: applyDownloadFrequencyStrategy(),
                    moduleInformation: getModuleInformation()
                }).then(function (data) {
                    return filterChartsForModules(data.moduleInformation, data.strategyResult.charts)
                        .then(recursivelyDownloadAndUpsertChartData)
                        .then(function() {
                            if(allDownloadsWereSuccessful) {
                                updateChangeLogs(data.strategyResult.changeLogKeys);
                            }
                        });
                });
            };

            var recursivelyLoopThroughModules = function (moduleIds, charts, projectId) {
                if(_.isEmpty(moduleIds)){
                    return $q.when();
                }
                return downloadRelevantChartDataForModule(moduleIds.pop(), charts, projectId).then(function () {
                    return recursivelyLoopThroughModules(moduleIds, charts, projectId);
                });
            };

            var updateChartDataForProject = function(projectId) {
                return $q.all({
                    modules: orgUnitRepository.getAllModulesInOrgUnits([projectId]),
                    charts: chartRepository.getAll(),
                }).then(function (data) {
                    return recursivelyLoopThroughModules(data.modules, data.charts, projectId);
                });
            };

            var recursivelyLoopThroughProjects = function(projectIds) {
                if(_.isEmpty(projectIds)) {
                    return $q.when();
                }
                return updateChartDataForProject(projectIds.pop()).then(function() {
                    return recursivelyLoopThroughProjects(projectIds);
                });
            };

            var getDownloadStartTime = function () {
                return systemInfoService.getServerDate().then(function (serverTime) {
                    downloadStartTime = serverTime;
                });
            };

            return getDownloadStartTime()
                .then(userPreferenceRepository.getCurrentUsersProjectIds)
                .then(recursivelyLoopThroughProjects);
        };
    };
});
