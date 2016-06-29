define(['properties', 'lodash', 'dateUtils', 'moment'], function (properties, _, dateUtils, moment) {
    return function (dataService, approvalService, datasetRepository, userPreferenceRepository, changeLogRepository, orgUnitRepository,
                     moduleDataBlockFactory, moduleDataBlockMerger, eventService, $q) {

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

        var recursivelyDownloadMergeAndSaveModules = function(options) {
            if (_.isEmpty(options.modules)) {
                var allModulesSyncedSuccessfully = !options.atLeastOneModuleHasFailed;
                return $q.when(allModulesSyncedSuccessfully);
            }

            var onSuccess = function() {
                return recursivelyDownloadMergeAndSaveModules(options);
            };

            var onFailure = function() {
                options.atLeastOneModuleHasFailed = true;
                return recursivelyDownloadMergeAndSaveModules(options);
            };

            return getModuleDataBlocks({
                moduleId: options.modules.pop().id,
                periodRange: options.periodRange,
                lastUpdatedTimestamp: options.lastUpdatedTimestamp
            })
            .then(getOriginsForModule)
            .then(getDataSetsForModuleAndOrigins)
            .then(getModuleDataFromDhis)
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

        var getDataSetsForModuleAndOrigins = function(data) {
            var originOrgUnitIds = _.pluck(data.originOrgUnits, 'id');

            return datasetRepository.findAllForOrgUnits(originOrgUnitIds.concat(data.moduleId)).then(function(dataSets){
                var aggregatedDataSetIds = getAggregateDataSetIds(dataSets);

                return _.merge({
                    allDataSetIds: _.pluck(dataSets, 'id'),
                    aggregateDataSetIds: aggregatedDataSetIds
                }, data);
            });
        };

        var getModuleDataFromDhis = function (data) {
            var isLineListService = _.first(data.moduleDataBlocks).lineListService;

            if (isLineListService) {
                return getEventsFromDhis(data).then(getEventIdsFromDhis);
            } else {
                return getIndexedDataValuesFromDhis(data);
            }
        };

        var getIndexedDataValuesFromDhis = function(data) {
            return dataService.downloadData(data.moduleId, data.aggregateDataSetIds, data.periodRange, data.lastUpdatedTimestamp)
                .then(function (dataValues) {
                    var indexedDataValues = _.groupBy(dataValues, function(dataValue) {
                        return dataValue.period + data.moduleId;
                    });
                    return _.merge({ indexedDhisDataValues: indexedDataValues }, data);
                });
        };

        var getEventsFromDhis = function(data) {
            return eventService.getEvents(data.moduleId, data.periodRange, data.lastUpdatedTimestamp).then(function(events) {
                var groupedEvents = _.groupBy(events, function(event) {
                        var period = moment(event.eventDate).format('GGGG[W]WW');
                        return period + data.moduleId;
                    });

                return _.merge({ indexedDhisEvents: groupedEvents }, data);
            });
        };

        var getEventIdsFromDhis = function(data) {
            return eventService.getEventIds(data.moduleId, data.periodRange).then(function (eventIds) {
                return _.merge({ eventIds: eventIds }, data);
            });
        };

        var getIndexedCompletionsFromDhis = function (data) {
            return approvalService.getCompletionData(data.moduleId, data.originOrgUnits, data.allDataSetIds, data.periodRange).then(function(allCompletionData) {
                var indexedCompletions = _.indexBy(allCompletionData, function(completionData) {
                    return completionData.period + completionData.orgUnit;
                });
                return _.merge({ indexedDhisCompletions: indexedCompletions }, data);
            });
        };

        var getIndexedApprovalsFromDhis = function (data) {
            return approvalService.getApprovalData(data.moduleId, data.allDataSetIds, data.periodRange).then(function (allApprovalData) {
                var indexedApprovals = _.indexBy(allApprovalData, function(approvalData) {
                    return approvalData.period + approvalData.orgUnit;
                });
                return _.merge({ indexedDhisApprovals: indexedApprovals }, data);
            });
        };

        var mergeAndSaveModuleDataBlocks = function (data) {
            var mergePromises = _.map(data.moduleDataBlocks, function(moduleDataBlock) {
                var dhisDataValues = data.indexedDhisDataValues && data.indexedDhisDataValues[moduleDataBlock.period + moduleDataBlock.moduleId],
                    dhisCompletion = data.indexedDhisCompletions[moduleDataBlock.period + moduleDataBlock.moduleId],
                    dhisApproval = data.indexedDhisApprovals[moduleDataBlock.period + moduleDataBlock.moduleId],
                    dhisEvents = data.indexedDhisEvents && data.indexedDhisEvents[moduleDataBlock.period + moduleDataBlock.moduleId],
                    dhisEventIds = data.eventIds;

                return moduleDataBlockMerger.mergeAndSaveToLocalDatabase(moduleDataBlock, dhisDataValues, dhisCompletion, dhisApproval, dhisEvents, dhisEventIds);
            });
            return $q.all(mergePromises);
        };

        this.run = function () {
            return userPreferenceRepository.getCurrentUsersProjectIds().then(function (currentUserProjectIds) {
                return getLastUpdatedTime(currentUserProjectIds).then(function(projectLastUpdatedTimestamp) {
                    var periodRange = getPeriodRangeToDownload(projectLastUpdatedTimestamp);

                    return orgUnitRepository.getAllModulesInOrgUnits(currentUserProjectIds)
                        .then(function (allModules) {
                            return recursivelyDownloadMergeAndSaveModules({
                                modules: allModules,
                                periodRange: periodRange,
                                lastUpdatedTimestamp: projectLastUpdatedTimestamp
                            });
                        })
                        .then(function(allModulesSyncedSuccessfully) {
                            if(allModulesSyncedSuccessfully) {
                                return updateLastUpdatedTime(currentUserProjectIds);
                            }
                        });
                });
                });
        };
    };
});