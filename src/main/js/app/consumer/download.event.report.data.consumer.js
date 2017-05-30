define(['customAttributes', 'moment', 'constants'], function (CustomAttributes, moment, constants) {
    return function ($q, systemInfoService, userPreferenceRepository, orgUnitRepository, programRepository, eventReportRepository, changeLogRepository, reportService) {
        this.run = function () {
            var downloadStartTime, eventReportsByServiceCode, allDownloadsWereSuccessful;

            var getDownloadStartTime = function () {
                return systemInfoService.getServerDate().then(function (serverTime) {
                    downloadStartTime = serverTime;
                });
            };

            var downloadEventReportDataForProject = function (projectId) {
                var filterLineListModules = function (modules) {
                    return _.filter(modules, function (module) {
                        return CustomAttributes.getBooleanAttributeValue(module.attributeValues, CustomAttributes.LINE_LIST_ATTRIBUTE_CODE);
                    });
                };

                var getAssociatedProgramForModule = function (modules) {
                    var promises = _.map(modules, function (module) {
                        return orgUnitRepository.findAllByParent(module.id).then(_.first).then(function (firstOrigin) {
                            return programRepository.getProgramForOrgUnit(firstOrigin.id).then(function (program) {
                                return {
                                    module: module,
                                    program: program
                                };
                            });
                        });
                    });
                    return $q.all(promises);
                };

                var recursivelyDownloadEventReportsForModules = function (modulesAndItsPrograms) {

                    var downloadEventReportDataForModule = function (data) {
                        allDownloadsWereSuccessful = true;

                        var updateChangeLogForModule = function (changeLogKeys) {
                            var changeLogPromises = _.map(changeLogKeys, function (changeLogKey) {
                               return changeLogRepository.upsert(changeLogKey, downloadStartTime);
                            });
                            $q.all(changeLogPromises);
                        };

                        var downloadAndUpsertEventReportDataForModule = function (eventReports, module) {
                            if (_.isEmpty(eventReports))
                                return $q.when({});

                            var eventReport = eventReports.pop();

                            var onSuccess = function(response) {
                                return eventReportRepository.upsertEventReportData(eventReport.id, module.id, response)
                                    .then(function() {
                                        return downloadAndUpsertEventReportDataForModule(eventReports, module);
                                    });
                            };

                            var onFailure = function(response) {
                                allDownloadsWereSuccessful = false;
                                if (response && response.errorCode === constants.errorCodes.NETWORK_UNAVAILABLE) {
                                    return $q.reject(response);
                                }
                                return downloadAndUpsertEventReportDataForModule(eventReports, module);
                            };

                            return reportService.getEventReportDataForOrgUnit(eventReport, module).then(onSuccess, onFailure);
                        };

                        var eventReports = _.clone(data.eventReports);
                        return downloadAndUpsertEventReportDataForModule(eventReports, data.module)
                            .then(function () {
                                if(allDownloadsWereSuccessful) {
                                    return updateChangeLogForModule(data.changeLogKeys);
                            }
                        });
                    };

                    var applyEventReportsDownloadStrategyForModule = function (eventReports, module) {
                        var isDownloadedSameDay = function (lastUpdatedTime) {
                            return moment.utc().isSame(lastUpdatedTime, 'day');
                        };

                        var weeklyDataChangeLogKey = 'weeklyEventReportData:' + projectId + ':' + module.id;
                        var monthlyDataChangeLogKey = 'monthlyEventReportData:' + projectId + ':' + module.id;
                        return $q.all({
                            weeklyEventReportsLastDownloadedTime: changeLogRepository.get(weeklyDataChangeLogKey),
                            monthlyEventReportsLastDownloadedTime: changeLogRepository.get(monthlyDataChangeLogKey)
                        }).then(function (data) {
                            var changeLogKeys = [monthlyDataChangeLogKey, weeklyDataChangeLogKey];
                            if (data.monthlyEventReportsLastDownloadedTime && isDownloadedSameDay(data.monthlyEventReportsLastDownloadedTime)) {
                                _.remove(eventReports, 'monthlyReport');
                                _.pull(changeLogKeys, monthlyDataChangeLogKey);
                            }
                            if (data.weeklyEventReportsLastDownloadedTime && isDownloadedSameDay(data.weeklyEventReportsLastDownloadedTime)) {
                                _.remove(eventReports, 'weeklyReport');
                                _.pull(changeLogKeys, weeklyDataChangeLogKey);
                            }
                            return {
                                eventReports: eventReports,
                                changeLogKeys: changeLogKeys,
                                module: module
                            };
                        });
                    };

                    return _.reduce(modulesAndItsPrograms, function (promises, moduleAndItsProgram) {
                        var eventReports = eventReportsByServiceCode[moduleAndItsProgram.program.serviceCode];

                        var getInputForEventReportsDataDownload = function () {
                            return applyEventReportsDownloadStrategyForModule(eventReports, moduleAndItsProgram.module);
                        };

                        return promises
                            .then(getInputForEventReportsDataDownload)
                            .then(downloadEventReportDataForModule);
                    }, $q.when());
                };


                return orgUnitRepository.getAllModulesInOrgUnits([projectId])
                    .then(filterLineListModules)
                    .then(getAssociatedProgramForModule)
                    .then(recursivelyDownloadEventReportsForModules);
            };

            var recursivelyLoopThroughProjects = function (projectIds) {
                return _.reduce(projectIds, function (promise, projectId) {
                    return promise.then(function () {
                        return downloadEventReportDataForProject(projectId);
                    });
                }, $q.when());
            };

            var getAllEventReports = function () {
                return eventReportRepository.getAll().then(function (allEventReports) {
                    eventReportsByServiceCode = _.groupBy(allEventReports, 'serviceCode');
                });
            };

            return getDownloadStartTime()
                .then(getAllEventReports)
                .then(userPreferenceRepository.getCurrentUsersProjectIds)
                .then(recursivelyLoopThroughProjects);
        };
    };
});
