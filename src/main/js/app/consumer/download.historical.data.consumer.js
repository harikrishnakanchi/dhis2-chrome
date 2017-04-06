define(['lodash', 'moment', 'dateUtils', 'properties', 'customAttributes', 'constants'], function (_, moment, dateUtils, properties, customAttributes, constants) {
    return function ($q, mergeBy, dataService, eventService, systemInfoService, userPreferenceRepository, orgUnitRepository, datasetRepository, changeLogRepository, dataRepository, programEventRepository, lineListEventsMerger) {
        var CHANGE_LOG_PREFIX = 'yearlyDataValues',
            CHUNK_SIZE = 11;

        var getProjectIds = function () {
            return userPreferenceRepository.getCurrentUsersProjectIds();
        };

        var getModulesForProjects = function (projectIds) {
            var getModulesForProject = function (projectId) {
                return orgUnitRepository.getAllModulesInOrgUnits(projectId).then(function (modules) {
                    return _.map(modules, function (module) {
                        return _.set(module, 'projectId', projectId);
                    });
                });
            };

            return $q.all(_.map(projectIds, getModulesForProject)).then(_.flatten);
        };

        var getAllOriginsOfModules = function (modules) {
            return $q.all(_.map(modules, function (module) {
                return orgUnitRepository.findAllByParent(module.id).then(function (origins) {
                    return _.set(module, 'origins', origins);
                });
            }));
        };

        var getAllDataSetsForAllOrgUnits = function (modules) {
            return $q.all(_.map(modules, function (module) {
                var moduleAndOrigins = [module].concat(module.origins);
                return datasetRepository.findAllForOrgUnits(moduleAndOrigins).then(function (dataSets) {
                    return _.set(module, 'dataSetIds', _.map(dataSets, 'id'));
                });
            }));
        };

        var downloadData = function (modules) {
            var dataValueEquals = function (dataValueA, dataValueB) {
                return dataValueA.dataElement === dataValueB.dataElement &&
                    dataValueA.period === dataValueB.period &&
                    dataValueA.orgUnit === dataValueB.orgUnit &&
                    dataValueA.categoryOptionCombo === dataValueB.categoryOptionCombo;
            };

            var periodRange = _.difference(dateUtils.getPeriodRangeInWeeks(properties.projectDataSync.numWeeksForHistoricalData, {excludeCurrent: true}),
                dateUtils.getPeriodRangeInWeeks(properties.projectDataSync.numWeeksToSync));

            var downloadDataForModule = function (module) {
                var changeLogKey = [CHANGE_LOG_PREFIX, module.projectId, module.id].join(':'),
                    downloadStartTime;

                var downloadModuleData = function (lastUpdatedTime) {
                    var getServerTime = function () {
                        return systemInfoService.getServerDate().then(function (serverTime) {
                            downloadStartTime = serverTime;
                        });
                    };

                    var downloadModuleDataValues = function () {
                        var periodChunks = _.chunk(periodRange, lastUpdatedTime ? periodRange.length : CHUNK_SIZE);

                        var getDataValuesFromIndexedDB = function (periodChunk) {
                            return dataRepository.getDataValuesForOrgUnitsAndPeriods(_.map(module.origins, 'id').concat(module.id), periodChunk).then(function (dataValues) {
                                return _.map(dataValues, 'dataValues');
                            });
                        };

                        return _.reduce(periodChunks, function (moduleChunkPromise, periodChunk) {
                            return moduleChunkPromise.then(function () {
                                return $q.all({
                                    dataValuesFromDHIS: dataService.downloadData(module.id, module.dataSetIds, periodChunk, lastUpdatedTime),
                                    dataValuesInPraxis: getDataValuesFromIndexedDB(periodChunk)
                                }).then(function (data) {
                                    return dataRepository.saveDhisData(mergeBy.lastUpdated({ eq: dataValueEquals }, data.dataValuesFromDHIS, data.dataValuesInPraxis));
                                });
                            });
                        }, $q.when());
                    };

                    var downloadLineListEvents = function () {
                        return $q.all({
                            eventsFromDHIS: eventService.getEvents(module.id, periodRange, lastUpdatedTime),
                            eventsInPraxis: programEventRepository.getEventsForOrgUnitsAndPeriods(_.map(module.origins, 'id'), periodRange)
                        }).then(function (data) {
                            return programEventRepository.upsert(lineListEventsMerger.create(data.eventsInPraxis, data.eventsFromDHIS).eventsToUpsert);
                        });
                    };

                    return getServerTime().then(function () {
                        var isLinelistModule = customAttributes.getBooleanAttributeValue(module.attributeValues, customAttributes.LINE_LIST_ATTRIBUTE_CODE);
                        return isLinelistModule ? downloadLineListEvents() : downloadModuleDataValues();
                    });
                };

                var onSuccess = function () {
                    return changeLogRepository.upsert(changeLogKey, downloadStartTime);
                };

                var onFailure = function (response) {
                    if(response && response.errorCode === constants.errorCodes.NETWORK_UNAVAILABLE){
                        return $q.reject();
                    }
                    return $q.when(); //continue with next module
                };

                return changeLogRepository.get(changeLogKey)
                    .then(downloadModuleData)
                    .then(onSuccess, onFailure);
            };

            return _.reduce(modules, function (existingPromises, module) {
                return existingPromises.then(_.partial(downloadDataForModule, module));
            }, $q.when());
        };

        this.run = function () {
            return getProjectIds()
                .then(getModulesForProjects)
                .then(getAllOriginsOfModules)
                .then(getAllDataSetsForAllOrgUnits)
                .then(downloadData);
        };
    };
});