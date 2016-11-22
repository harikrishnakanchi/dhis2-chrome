define(['properties', 'dateUtils'], function (properties, dateUtils) {
    return function (moduleDataBlockFactory, dataService, eventService, datasetRepository, approvalService, orgUnitRepository, changeLogRepository, moduleDataBlockMerger, $q) {
        var getModuleDataBlock = function(data) {
            return moduleDataBlockFactory.create(data.moduleId, data.period).then(function (moduleDataBlock) {
                return _.assign({}, data, { moduleDataBlock: moduleDataBlock });
            });
        };

        var getModuleOrgUnit = function (data) {
            return orgUnitRepository.get(data.moduleId).then(function (module) {
                return _.merge({ module: module }, data);
            });
        };

        var getOriginOrgUnits = function(data) {
            return orgUnitRepository.findAllByParent([data.moduleId]).then(function(originOrgUnits){
                return _.merge({ originOrgUnits: originOrgUnits }, data);
            });
        };

        var getDataSetsForModulesAndOrigins = function (data) {
            var getAggregateDataSetIds = function(allDataSets) {
                var aggregateDataSets = _.filter(allDataSets, { isLineListService: false });
                return _.pluck(aggregateDataSets, 'id');
            };

            return datasetRepository.findAllForOrgUnits(data.originOrgUnits.concat(data.module)).then(function(allDataSets) {
                var aggregateDataSetIds = getAggregateDataSetIds(allDataSets);
                return _.merge({
                    allDataSetIds: _.pluck(allDataSets, 'id'),
                    aggregateDataSetIds: aggregateDataSetIds
                }, data);
            });
        };

        var getLastUpdatedTime = function(data) {
            return orgUnitRepository.getParentProject(data.moduleId).then(function(projectOrgUnit) {
                return changeLogRepository.get('dataValues:' + projectOrgUnit.id).then(function(lastUpdatedTime) {
                    return _.merge({ lastUpdatedTime: lastUpdatedTime }, data);
                });
            });
        };

        var getModuleDataFromDhis = function(data) {
            var getDataValuesFromDhis = function(data) {
                return dataService.downloadData(data.moduleId, data.aggregateDataSetIds, data.period, data.lastUpdatedTime).then(function (dataValues) {
                    return _.merge({ dhisDataValues: dataValues }, data);
                });
            };

            var getEventsFromDhis = function(data) {
                return eventService.getEvents(data.moduleId, [data.period], data.lastUpdatedTime).then(function (events) {
                    return _.merge({ events: events }, data);
                });
            };

            var getEventIdsFromDhis = function(data) {
                var periodRange = dateUtils.getPeriodRange(properties.projectDataSync.numWeeksToSync);
                return eventService.getEventIds(data.moduleId, periodRange).then(function (eventIds){
                    return _.merge({ eventIds: eventIds }, data);
                });
            };

            return data.moduleDataBlock.lineListService ? getEventsFromDhis(data).then(getEventIdsFromDhis) : getDataValuesFromDhis(data);
        };

        var getCompletionFromDhis = function (data) {
            return approvalService.getCompletionData(data.moduleId, data.originOrgUnits, data.allDataSetIds, [data.period]).then(function (allCompletionData) {
                var completionData = _.find(allCompletionData, { orgUnit: data.moduleId, period: data.period });
                return _.merge({ dhisCompletion: completionData }, data);
            });
        };

        var getApprovalFromDhis = function (data) {
            return approvalService.getApprovalData(data.moduleId, data.allDataSetIds, [data.period]).then(function (allApprovalData) {
                var approvalData = _.find(allApprovalData, { orgUnit: data.moduleId, period: data.period });
                return _.merge({ dhisApproval: approvalData }, data);
            });
        };

        var mergeAndSaveModuleDataBlock = function (data) {
            return moduleDataBlockMerger.mergeAndSaveToLocalDatabase(data.moduleDataBlock, data.dhisDataValues, data.dhisCompletion, data.dhisApproval, data.events, data.eventIds).then(function() {
                return data;
            });
        };

        var uploadModuleDataBlockToDhis = function (data) {
            return moduleDataBlockMerger.uploadToDHIS(data.moduleDataBlock, data.dhisCompletion, data.dhisApproval, data.eventIds);
        };

        this.run = function(message) {
            var messageData = message.data.data;

            return getModuleDataBlock({
                moduleId: messageData.moduleId,
                period: messageData.period
            })
                .then(getModuleOrgUnit)
                .then(getOriginOrgUnits)
                .then(getDataSetsForModulesAndOrigins)
                .then(getLastUpdatedTime)
                .then(getModuleDataFromDhis)
                .then(getCompletionFromDhis)
                .then(getApprovalFromDhis)
                .then(mergeAndSaveModuleDataBlock)
                .then(getModuleDataBlock)
                .then(uploadModuleDataBlockToDhis);
        };
    };
});
