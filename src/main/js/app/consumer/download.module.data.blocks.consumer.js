define(['properties', 'lodash', 'dateUtils'], function (properties, _, dateUtils) {
    return function (dataService, approvalService, datasetRepository, userPreferenceRepository, changeLogRepository, orgUnitRepository,
                     moduleDataBlockFactory, moduleDataBlockMerger, $q) {
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

            var continueRecursion = function() {
                return recursivelyDownloadMergeAndSaveModules(modules);
            };

            return getModuleDataBlocks({
                moduleId: modules.pop().id,
                dataSetIds: dataSetIds,
                periodRange: periodRange,
                lastUpdatedTimestamp: lastUpdatedTimestamp
            })
            .then(getIndexedDataValuesFromDhis)
            .then(getIndexedCompletionsFromDhis)
            .then(getIndexedApprovalsFromDhis)
            .then(mergeAndSaveModuleDataBlocks)
            .then(continueRecursion, continueRecursion);
        };

        var getModuleDataBlocks = function(data) {
            return moduleDataBlockFactory.createForModule(data.moduleId, data.periodRange).then(function(moduleDataBlocks) {
                return _.merge({ moduleDataBlocks: moduleDataBlocks }, data);
            });
        };

        var getIndexedDataValuesFromDhis = function(data) {
            return dataService.downloadData(data.moduleId, data.dataSetIds, data.periodRange, data.lastUpdatedTimestamp)
                .then(function (dataValues) {
                    var indexedDataValues = _.groupBy(dataValues, function(dataValue) {
                        return dataValue.period + dataValue.orgUnit;
                    });
                    return _.merge({ indexedDhisDataValues: indexedDataValues }, data);
                });
        };

        var getIndexedCompletionsFromDhis = function (data) {
            return orgUnitRepository.findAllByParent([data.moduleId]).then(function (originOrgUnits) {
                var originOrgUnitsIds = _.pluck(originOrgUnits, 'id');
                return approvalService.getCompletionData(data.moduleId, originOrgUnitsIds, data.dataSetIds).then(function(allCompletionData) {
                    var indexedCompletions = _.indexBy(allCompletionData, function(completionData) {
                        return completionData.period + completionData.orgUnit;
                    });
                    return _.merge({ indexedDhisCompletions: indexedCompletions }, data);
                });
            });
        };

        var getIndexedApprovalsFromDhis = function (data) {
            return approvalService.getApprovalData(data.moduleId, data.dataSetIds, data.periodRange).then(function (allApprovalData) {
                var indexedApprovals = _.indexBy(allApprovalData, function(approvalData) {
                    return approvalData.period + approvalData.orgUnit;
                });
                return _.merge({ indexedDhisApprovals: indexedApprovals }, data);
            });
        };

        var mergeAndSaveModuleDataBlocks = function (data) {
            var mergePromises = _.map(data.moduleDataBlocks, function(moduleDataBlock) {
                var dhisDataValues = data.indexedDhisDataValues[moduleDataBlock.period + moduleDataBlock.orgUnit],
                    dhisCompletion = data.indexedDhisCompletions[moduleDataBlock.period + moduleDataBlock.orgUnit],
                    dhisApproval = data.indexedDhisApprovals[moduleDataBlock.period + moduleDataBlock.orgUnit];

                return moduleDataBlockMerger.mergeAndSaveToLocalDatabase(moduleDataBlock, dhisDataValues, dhisCompletion, dhisApproval);
            });
            return $q.all(mergePromises);
        };

        this.run= function () {
            return datasetRepository.getAll().then(function (allDataSets) {
                var allDataSetsIds = _.pluck(allDataSets, 'id');

                return userPreferenceRepository.getCurrentUsersProjectIds().then(function (currentUserProjectIds) {
                    getLastUpdatedTime(currentUserProjectIds).then(function(projectLastUpdatedTimestamp) {
                        var periodRange = getPeriodRangeToDownload(projectLastUpdatedTimestamp);

                        orgUnitRepository.getAllModulesInOrgUnits(currentUserProjectIds).then(function (allModules) {
                            return recursivelyDownloadMergeAndSaveModules(allModules, allDataSetsIds, periodRange, projectLastUpdatedTimestamp);
                        });
                    });
                });
            });
        };
    };
});