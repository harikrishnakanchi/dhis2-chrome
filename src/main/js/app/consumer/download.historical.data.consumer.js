define(['lodash', 'moment', 'dateUtils', 'properties', 'customAttributes'], function (_, moment, dateUtils, properties, customAttributes) {
    return function ($q, dataService, eventService, userPreferenceRepository, orgUnitRepository, datasetRepository, changeLogRepository, dataRepository, programEventRepository) {
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
            var periodRange = _.difference(dateUtils.getPeriodRange(properties.projectDataSync.numWeeksForHistoricalData, {excludeCurrentWeek: true}),
                dateUtils.getPeriodRange(properties.projectDataSync.numWeeksToSync));

            var downloadDataForModule = function (module) {
                var changeLogKey = [CHANGE_LOG_PREFIX, module.projectId, module.id].join(':');

                var downloadModuleData = function () {

                    var downloadModuleDataValues = function () {
                        var periodChunks = _.chunk(periodRange, CHUNK_SIZE);

                        return _.reduce(periodChunks, function (moduleChunkPromise, periodChunk) {
                            return moduleChunkPromise.then(function () {
                                return dataService.downloadData(module.id, module.dataSetIds, periodChunk).then(dataRepository.saveDhisData);
                            });
                        }, $q.when());
                    };

                    var downloadLineListEvents = function () {
                        return eventService.getEvents(module.id, periodRange).then(programEventRepository.upsert);
                    };

                    var isLinelistModule = customAttributes.getBooleanAttributeValue(module.attributeValues, 'isLineListService');
                    return isLinelistModule ? downloadLineListEvents() : downloadModuleDataValues();
                };

                var onSuccess = function () {
                    return changeLogRepository.upsert(changeLogKey, moment().toISOString());
                };

                var onFailure = function () {
                    return $q.when(); //continue with next module
                };

                return changeLogRepository.get(changeLogKey).then(function (lastUpdatedTime) {
                    var areDataValuesAlreadyDownloaded = !!lastUpdatedTime;
                    return areDataValuesAlreadyDownloaded ? $q.when() : downloadModuleData().then(onSuccess, onFailure);
                });
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