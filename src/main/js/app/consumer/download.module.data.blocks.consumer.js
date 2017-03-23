define(['properties', 'lodash', 'dateUtils', 'moment', 'constants'], function (properties, _, dateUtils, moment, constants) {
    return function (dataService, approvalService, systemInfoService, datasetRepository, userPreferenceRepository, changeLogRepository, orgUnitRepository,
                     moduleDataBlockFactory, moduleDataBlockMerger, eventService, $q) {

        var CHANGE_LOG_PREFIX = 'dataValues';

        var getAggregateDataSetIds = function(allDataSets) {
            var aggregateDataSets = _.filter(allDataSets, { isLineListService: false });
            return _.pluck(aggregateDataSets, 'id');
        };

        var getPeriodRangeToDownload = function(lastUpdatedTimestamp) {
            var numberOfWeeks = lastUpdatedTimestamp ? properties.projectDataSync.numWeeksToSync : properties.projectDataSync.numWeeksToSyncOnFirstLogIn;
            return dateUtils.getPeriodRangeInWeeks(numberOfWeeks);
        };

        var getModuleDataBlocks = function(data) {
            return moduleDataBlockFactory.createForModule(data.module.id, data.periodRange).then(function(moduleDataBlocks) {
                return _.merge({ moduleDataBlocks: moduleDataBlocks }, data);
            });
        };

        var getLastUpdatedTimeForModule = function(data) {
            var changeLogKey = [CHANGE_LOG_PREFIX, data.projectId, data.module.id].join(':');

            return changeLogRepository.get(changeLogKey).then(function (lastUpdatedTime) {
                return _.merge({
                    lastUpdatedTimestamp: lastUpdatedTime,
                    periodRange: getPeriodRangeToDownload(lastUpdatedTime)
                }, data);
            });
        };

        var setDownloadStartTime = function (data) {
            return systemInfoService.getServerDate().then(function (serverDate) {
                return _.merge({
                    downloadStartTime: serverDate
                }, data);
            });
        };

        var updateLastUpdatedTime = function(data) {
            var changeLogKey = [CHANGE_LOG_PREFIX, data.projectId, data.module.id].join(':');

            return changeLogRepository.upsert(changeLogKey, data.downloadStartTime);
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
            return $q.all(mergePromises).then(function () { return data; });
        };

        var recursivelyDownloadMergeAndSaveModules = function(options) {
            if (_.isEmpty(options.modules)) {
                return $q.when();
            }

            var onSuccess = function() {
                return recursivelyDownloadMergeAndSaveModules(options);
            };

            var onFailure = function (response) {
                if(response && response.errorCode === constants.errorCodes.NETWORK_UNAVAILABLE){
                    return $q.reject();
                }
                return recursivelyDownloadMergeAndSaveModules(options);
            };

            return getLastUpdatedTimeForModule({
                module: options.modules.pop(),
                projectId: options.projectId
            })
                .then(setDownloadStartTime)
                .then(getModuleDataBlocks)
                .then(getOriginsForModule)
                .then(getDataSetsForModuleAndOrigins)
                .then(getModuleDataFromDhis)
                .then(getIndexedCompletionsFromDhis)
                .then(getIndexedApprovalsFromDhis)
                .then(mergeAndSaveModuleDataBlocks)
                .then(updateLastUpdatedTime)
                .then(onSuccess, onFailure);
        };

        var downloadModuleDataForProject = function(projectId) {
            return orgUnitRepository.getAllModulesInOrgUnits([projectId])
                .then(function (allModules) {
                    return recursivelyDownloadMergeAndSaveModules({
                        modules: allModules,
                        projectId: projectId
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