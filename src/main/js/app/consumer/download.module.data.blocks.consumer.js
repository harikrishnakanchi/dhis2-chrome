define(['properties', 'lodash', 'dateUtils', 'moment'], function (properties, _, dateUtils, moment) {
    return function (dataService, approvalService, datasetRepository, userPreferenceRepository, changeLogRepository, orgUnitRepository,
                     moduleDataBlockFactory, moduleDataBlockMerger, $q) {

        var getAggregateDataSetIds = function(allDataSets) {
            var aggregateDataSets = _.filter(allDataSets, { isLineListService: false });
            return _.pluck(aggregateDataSets, 'id');
        };

        var getLastUpdatedTime = function(userProjectIds) {
            return changeLogRepository.get("dataValues:" + userProjectIds.join(';'));
        };

        var updateLastUpdatedTime = function(userProjectIds) {
            return changeLogRepository.upsert("dataValues:" + userProjectIds.join(';'), moment().toISOString());
        };

        var getPeriodRangeToDownload = function(projectLastUpdatedTimestamp) {
            var numberOfWeeks = projectLastUpdatedTimestamp ? properties.projectDataSync.numWeeksToSync : properties.projectDataSync.numWeeksToSyncOnFirstLogIn;
            return dateUtils.getPeriodRange(numberOfWeeks);
        };

        var recursivelyDownloadMergeAndSaveModules = function(modules, dataSetIds, periodRange, lastUpdatedTimestamp, atLeastOneModuleHasFailed) {
            if (_.isEmpty(modules)) {
                var allModulesSyncedSuccessfully = !atLeastOneModuleHasFailed;
                return $q.when(allModulesSyncedSuccessfully);
            }

            var onSuccess = function() {
                return recursivelyDownloadMergeAndSaveModules(modules, dataSetIds, periodRange, lastUpdatedTimestamp, atLeastOneModuleHasFailed);
            };

            var onFailure = function() {
                atLeastOneModuleHasFailed = true;
                return recursivelyDownloadMergeAndSaveModules(modules, dataSetIds, periodRange, lastUpdatedTimestamp, atLeastOneModuleHasFailed);
            };

            return getModuleDataBlocks({
                moduleId: modules.pop().id,
                dataSetIds: dataSetIds,
                periodRange: periodRange,
                lastUpdatedTimestamp: lastUpdatedTimestamp
            })
            .then(getOriginsForModule)
            .then(getIndexedDataValuesFromDhis)
            .then(getIndexedCompletionsFromDhis)
            .then(getIndexedApprovalsFromDhis)
            .then(mergeAndSaveModuleDataBlocks)
            .then(onSuccess, onFailure);
        };

        var getModuleDataBlocks = function(data) {
            return moduleDataBlockFactory.createForModule(data.moduleId, data.periodRange).then(function(moduleDataBlocks) {
                return _.merge({ moduleDataBlocks: moduleDataBlocks }, data);
            });
        };

        var getOriginsForModule = function(data) {
            return orgUnitRepository.findAllByParent([data.moduleId]).then(function (originOrgUnits) {
                return _.merge({ originOrgUnits: originOrgUnits }, data);
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
            var originOrgUnitsIds = _.pluck(data.originOrgUnits, 'id');

            return approvalService.getCompletionData(data.moduleId, originOrgUnitsIds, data.dataSetIds, data.periodRange).then(function(allCompletionData) {
                var indexedCompletions = _.indexBy(allCompletionData, function(completionData) {
                    return completionData.period + completionData.orgUnit;
                });
                return _.merge({ indexedDhisCompletions: indexedCompletions }, data);
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
                var dhisDataValues = data.indexedDhisDataValues[moduleDataBlock.period + moduleDataBlock.moduleId],
                    dhisCompletion = data.indexedDhisCompletions[moduleDataBlock.period + moduleDataBlock.moduleId],
                    dhisApproval = data.indexedDhisApprovals[moduleDataBlock.period + moduleDataBlock.moduleId];

                return moduleDataBlockMerger.mergeAndSaveToLocalDatabase(moduleDataBlock, dhisDataValues, dhisCompletion, dhisApproval);
            });
            return $q.all(mergePromises);
        };

        this.run = function () {
            return datasetRepository.getAll().then(function (allDataSets) {
                var aggregateDataSetIds = getAggregateDataSetIds(allDataSets);

                return userPreferenceRepository.getCurrentUsersProjectIds().then(function (currentUserProjectIds) {
                    return getLastUpdatedTime(currentUserProjectIds).then(function(projectLastUpdatedTimestamp) {
                        var periodRange = getPeriodRangeToDownload(projectLastUpdatedTimestamp);

                        return orgUnitRepository.getAllModulesInOrgUnits(currentUserProjectIds)
                            .then(function (allModules) {
                                return recursivelyDownloadMergeAndSaveModules(allModules, aggregateDataSetIds, periodRange, projectLastUpdatedTimestamp);
                            })
                            .then(function(allModulesSyncedSuccessfully) {
                                if(allModulesSyncedSuccessfully) {
                                    return updateLastUpdatedTime(currentUserProjectIds);
                                }
                            });
                    });
                });
            });
        };
    };
});