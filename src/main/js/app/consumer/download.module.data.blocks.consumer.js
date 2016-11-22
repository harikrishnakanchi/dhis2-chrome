define(['properties', 'lodash', 'dateUtils', 'moment'], function (properties, _, dateUtils, moment) {
    return function (dataService, approvalService, datasetRepository, userPreferenceRepository, changeLogRepository, orgUnitRepository,
                     moduleDataBlockFactory, moduleDataBlockMerger, eventService, $q) {

        var getAggregateDataSetIds = function(allDataSets) {
            var aggregateDataSets = _.filter(allDataSets, { isLineListService: false });
            return _.pluck(aggregateDataSets, 'id');
        };

        var getLastUpdatedTime = function(projectId) {
            return changeLogRepository.get("dataValues:" + projectId);
        };

        var updateLastUpdatedTime = function(projectId) {
            return changeLogRepository.upsert("dataValues:" + projectId, moment().toISOString());
        };

        var getPeriodRangeToDownload = function(projectLastUpdatedTimestamp) {
            var numberOfWeeks = projectLastUpdatedTimestamp ? properties.projectDataSync.numWeeksToSync : properties.projectDataSync.numWeeksToSyncOnFirstLogIn;
            return dateUtils.getPeriodRange(numberOfWeeks);
        };

        var getModuleDataBlocks = function(data) {
            return moduleDataBlockFactory.createForModule(data.module.id, data.periodRange).then(function(moduleDataBlocks) {
                return _.merge({ moduleDataBlocks: moduleDataBlocks }, data);
            });
        };

        var getOriginsForModule = function(data) {
            return orgUnitRepository.findAllByParent([data.module.id]).then(function (originOrgUnits) {
                return _.merge({ originOrgUnits: originOrgUnits }, data);
            });
        };

        var getDataSetsForModuleAndOrigins = function(data) {
            var orgUnits = [data.module].concat(data.originOrgUnits);

            return datasetRepository.findAllForOrgUnits(orgUnits).then(function(dataSets){
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
            return dataService.downloadData(data.module.id, data.aggregateDataSetIds, data.periodRange, data.lastUpdatedTimestamp)
                .then(function (dataValues) {
                    var indexedDataValues = _.groupBy(dataValues, function(dataValue) {
                        return dataValue.period + data.module.id;
                    });
                    return _.merge({ indexedDhisDataValues: indexedDataValues }, data);
                });
        };

        var getEventsFromDhis = function(data) {
            return eventService.getEvents(data.module.id, data.periodRange, data.lastUpdatedTimestamp).then(function(events) {
                var groupedEvents = _.groupBy(events, function(event) {
                        var period = moment(event.eventDate).format('GGGG[W]WW');
                        return period + data.module.id;
                    });

                return _.merge({ indexedDhisEvents: groupedEvents }, data);
            });
        };

        var getEventIdsFromDhis = function(data) {
            return eventService.getEventIds(data.module.id, data.periodRange).then(function (eventIds) {
                return _.merge({ eventIds: eventIds }, data);
            });
        };

        var getIndexedCompletionsFromDhis = function (data) {
            return approvalService.getCompletionData(data.module.id, data.originOrgUnits, data.allDataSetIds, data.periodRange).then(function(allCompletionData) {
                var indexedCompletions = _.indexBy(allCompletionData, function(completionData) {
                    return completionData.period + completionData.orgUnit;
                });
                return _.merge({ indexedDhisCompletions: indexedCompletions }, data);
            });
        };

        var getIndexedApprovalsFromDhis = function (data) {
            return approvalService.getApprovalData(data.module.id, data.allDataSetIds, data.periodRange).then(function (allApprovalData) {
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
                module: options.modules.pop(),
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

        var downloadModuleDataForProject = function(projectId) {
            return getLastUpdatedTime(projectId).then(function(projectLastUpdatedTimestamp) {
                var periodRange = getPeriodRangeToDownload(projectLastUpdatedTimestamp);

                return orgUnitRepository.getAllModulesInOrgUnits([projectId])
                    .then(function (allModules) {
                        return recursivelyDownloadMergeAndSaveModules({
                            modules: allModules,
                            periodRange: periodRange,
                            lastUpdatedTimestamp: projectLastUpdatedTimestamp
                        });
                    })
                    .then(function(allModulesSyncedSuccessfully) {
                        if(allModulesSyncedSuccessfully) {
                            return updateLastUpdatedTime(projectId);
                        }
                    });
            });
        };

        var recursivelyLoopThroughProjects = function(projectIds) {
            if(_.isEmpty(projectIds)) {
                return $q.when();
            }

            return downloadModuleDataForProject(projectIds.pop()).then(function() {
                return recursivelyLoopThroughProjects(projectIds);
            });
        };

        this.run = function () {
            return userPreferenceRepository.getCurrentUsersProjectIds().then(recursivelyLoopThroughProjects);
        };
    };
});