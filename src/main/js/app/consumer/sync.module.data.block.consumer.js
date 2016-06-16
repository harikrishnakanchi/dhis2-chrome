define([], function () {
    return function (moduleDataBlockFactory, dataService, datasetRepository, approvalService, orgUnitRepository, moduleDataBlockMerger) {
        var getModuleDataBlock = function(data) {
            return moduleDataBlockFactory.create(data.moduleId, data.period).then(function (moduleDataBlock) {
                return _.merge({ moduleDataBlock: moduleDataBlock }, data);
            });
        };

        var getOriginOrgUnits = function(data) {
            return orgUnitRepository.findAllByParent([data.moduleId]).then(function(originOrgUnits){
                return _.merge({ originOrgUnits: originOrgUnits }, data);
            });
        };

        var getDataSetsForModulesAndOrigins = function (data) {
            var originOrgUnitIds = _.pluck(data.originOrgUnits, 'id');

            return datasetRepository.findAllForOrgUnits(originOrgUnitIds.concat(data.moduleId)).then(function(allDataSets) {
                var aggregateDataSetIds = getAggregateDataSetIds(allDataSets);
                return _.merge({
                    allDataSetIds: _.pluck(allDataSets, 'id'),
                    aggregateDataSetIds: aggregateDataSetIds
                }, data);
            });
        };

        var getAggregateDataSetIds = function(allDataSets) {
            var aggregateDataSets = _.filter(allDataSets, { isLineListService: false });
            return _.pluck(aggregateDataSets, 'id');
        };

        var getDataValuesFromDhis = function(data) {
            return dataService.downloadData(data.moduleId, data.aggregateDataSetIds, data.period, null).then(function (dataValues) {
                return _.merge({ dhisDataValues: dataValues }, data);
            });
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
            return moduleDataBlockMerger.mergeAndSaveToLocalDatabase(data.moduleDataBlock, data.dhisDataValues, data.dhisCompletion, data.dhisApproval).then(function() {
                return data;
            });
        };

        var uploadModuleDataBlockToDhis = function (data) {
            return moduleDataBlockMerger.uploadToDHIS(data.moduleDataBlock, data.dhisCompletion, data.dhisApproval);
        };

        this.run = function(message) {
            var messageData = message.data.data;

            return getModuleDataBlock({
                moduleId: messageData.moduleId,
                period: messageData.period
            })
                .then(getOriginOrgUnits)
                .then(getDataSetsForModulesAndOrigins)
                .then(getDataValuesFromDhis)
                .then(getCompletionFromDhis)
                .then(getApprovalFromDhis)
                .then(mergeAndSaveModuleDataBlock)
                .then(getModuleDataBlock)
                .then(uploadModuleDataBlockToDhis);
        };
    };
});
