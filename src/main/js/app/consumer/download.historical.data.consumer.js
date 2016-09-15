define(['lodash', 'moment', 'dateUtils', 'properties'], function (_, moment, dateUtils, properties) {
    return function ($q, dataService, userPreferenceRepository, orgUnitRepository, datasetRepository, changeLogRepository, dataRepository) {
        var CHANGE_LOG_PREFIX = 'yearlyDataValues',
            CHUNK_SIZE = 10;

        var getProjectIds = function () {
            return userPreferenceRepository.getCurrentUsersProjectIds();
        };

        var getModulesForProjects = function (projectIds) {
            var modulesByProject = {};
            _.each(projectIds, function (projectId) {
                modulesByProject[projectId] = orgUnitRepository.getAllModulesInOrgUnits(projectId);
            });
            return $q.all(modulesByProject);
        };

        var getAllOriginsOfModules = function (modulesByProject) {
            var promises = [];
            _.each(modulesByProject, function (modules) {
                _.each(modules, function (module) {
                    var promise = orgUnitRepository.findAllByParent([module.id]).then(function (origins) {
                        module.originIds = _.map(origins, 'id');
                    });
                    promises.push(promise);
                });
            });
            return $q.all(promises).then(function () {
                return modulesByProject;
            });
        };

        var getAllDataSetsForAllOrgUnits = function (modulesByProject) {
            var promises = [];
            _.each(modulesByProject, function (modules) {
                _.each(modules, function (module) {
                    var moduleAndOriginIds = [module.id].concat(module.originIds);
                    var promise = datasetRepository.findAllForOrgUnits(moduleAndOriginIds).then(function (dataSets) {
                        module.dataSetIds = _.map(dataSets, 'id');
                    });
                    promises.push(promise);
                });
            });
            return $q.all(promises).then(function () {
                return modulesByProject;
            });
        };

        var downloadDataValueSets = function (modulesByProject) {
            var periodRange = dateUtils.getPeriodRangeBetween(
                -properties.projectDataSync.numWeeksForHistoricalData,
                -properties.projectDataSync.numWeeksToSync
            );

            var periodChunks = _.chunk(periodRange, CHUNK_SIZE);

            return _.reduce(modulesByProject, function (promise, modules, projectId) {
                return promise.then(function () {
                    return _.reduce(modules, function (modulePromise, module) {
                        var downloadModuleDataValues = function () {
                            return _.reduce(periodChunks, function (moduleChunkPromise, periodChunk) {
                                return moduleChunkPromise.then(function () {
                                    return dataService.downloadData(module.id, module.dataSetIds, periodChunk).then(dataRepository.saveDhisData);
                                });
                            }, modulePromise);
                        };

                        var updateChangeLog = function () {
                            return changeLogRepository.upsert([CHANGE_LOG_PREFIX, projectId, module.id].join(':'), moment().toISOString());
                        };

                        return changeLogRepository.get([CHANGE_LOG_PREFIX, projectId, module.id].join(':')).then(function (lastUpdatedTime) {
                            var areDataValuesAlreadyDownloaded = !!lastUpdatedTime;
                            return areDataValuesAlreadyDownloaded ? modulePromise : downloadModuleDataValues().then(updateChangeLog);
                        });
                    }, promise);
                });
            }, $q.when());
        };

        this.run = function () {
            return getProjectIds()
                .then(getModulesForProjects)
                .then(getAllOriginsOfModules)
                .then(getAllDataSetsForAllOrgUnits)
                .then(downloadDataValueSets);
        };
    };
});