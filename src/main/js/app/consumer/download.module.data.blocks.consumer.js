define(['properties', 'lodash', 'dateUtils'], function (properties, _, dateUtils) {
    return function (dataService, approvalService, datasetRepository, userPreferenceRepository, moduleDataBlockFactory, changeLogRepository, orgUnitRepository) {
        var getLastUpdatedTime = function(userProjectIds) {
            return changeLogRepository.get("dataValues:" + userProjectIds.join(';'));
        };

        var getPeriodRangeToDownload = function(projectLastUpdatedTimestamp) {
            var numberOfWeeks = projectLastUpdatedTimestamp ? properties.projectDataSync.numWeeksToSync : properties.projectDataSync.numWeeksToSyncOnFirstLogIn;
            return dateUtils.getPeriodRange(numberOfWeeks);
        };

        var recursivelyDownloadMergeAndSaveModules = function(modules, dataSetIds, periodRange, lastUpdatedTimestamp) {
            if (_.isEmpty(modules))
                return $q.when();

            return getIndexedModuleDataBlocks({
                moduleId: modules.pop().id,
                dataSetIds: dataSetIds,
                periodRange: periodRange,
                lastUpdatedTimestamp: lastUpdatedTimestamp
            })
            .then(getIndexedDataValuesFromDhis)
            .then(getIndexedCompletionsFromDhis)
            .then(getIndexedApprovalsFromDhis)
            .then(mergeAndSaveModuleDataBlocks)
            .finally(function() {
                return recursivelyDownloadMergeAndSaveModules(modules);
            });
        };

        var getIndexedModuleDataBlocks = function(data) {
            return moduleDataBlockFactory.createForProject(data.moduleId, data.periodRange).then(function() {
                return data;
            });
        };

        var getIndexedDataValuesFromDhis = function(data) {
            return dataService.downloadData(data.moduleId, data.dataSetIds, data.periodRange, data.lastUpdatedTimestamp)
                .then(function () {
                    return data;
                });
        };

        var getIndexedCompletionsFromDhis = function (data) {
            return orgUnitRepository.findAllByParent([data.moduleId]).then(function (originOrgUnits) {
                var originOrgUnitsIds = _.pluck(originOrgUnits, 'id');
                return approvalService.getCompletionData(data.moduleId, originOrgUnitsIds, data.dataSetIds);
            });
        };

        var getIndexedApprovalsFromDhis = function () {

        };

        var mergeAndSaveModuleDataBlocks = function () {

        };

        this.run= function () {
            return datasetRepository.getAll().then(function (allDataSets) {
                var allDataSetsIds = _.pluck(allDataSets, 'id');

                return userPreferenceRepository.getCurrentUsersProjectIds().then(function (currentUserProjectIds) {
                    getLastUpdatedTime(currentUserProjectIds).then(function(projectLastUpdatedTimestamp) {
                        var periodRange = getPeriodRangeToDownload(projectLastUpdatedTimestamp);

                        orgUnitRepository.getAllModulesInOrgUnits(currentUserProjectIds).then(function (allModules) {
                            recursivelyDownloadMergeAndSaveModules(allModules, allDataSetsIds, periodRange, projectLastUpdatedTimestamp);
                        });
                    });
                });
            });
        };
    };
});