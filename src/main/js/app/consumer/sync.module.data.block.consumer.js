define([], function () {
    return function (moduleDataBlockFactory, dataService, datasetRepository, approvalService, orgUnitRepository, moduleDataBlockMerger) {
        var getModuleDataBlock = function(data) {
            return moduleDataBlockFactory.create(data.moduleId, data.period).then(function (moduleDataBlock) {
                return _.merge({ moduleDataBlock: moduleDataBlock }, data);
            });
        };

        var getAggregateDataSetIds = function(allDataSets) {
            var aggregateDataSets = _.filter(allDataSets, { isLineListService: false });
            return _.pluck(aggregateDataSets, 'id');
        };

        var getDataValuesFromDhis = function(data) {
            return dataService.downloadData(data.moduleId, data.dataSetIds, data.period, null).then(function (dataValues) {
                return _.merge({ dhisDataValues: dataValues }, data);
            });
        };

        var getCompletionFromDhis = function (data) {
            return orgUnitRepository.findAllByParent([data.moduleId]).then(function (originOrgUnits) {
                var originOrgUnitsIds = _.pluck(originOrgUnits, 'id');
                return approvalService.getCompletionData(data.moduleId, originOrgUnitsIds, data.dataSetIds, [data.period]).then(function (allCompletionData) {
                    var completionData = _.find(allCompletionData, { orgUnit: data.moduleId, period: data.period });
                    return _.merge({ dhisCompletion: completionData }, data);
                });
            });
        };

        var getApprovalFromDhis = function (data) {
            return approvalService.getApprovalData(data.moduleId, data.dataSetIds, data.period).then(function (allApprovalData) {
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

            return datasetRepository.getAll().then(function (allDataSets) {
                var aggregateDataSetIds = getAggregateDataSetIds(allDataSets);

                return getModuleDataBlock({
                    moduleId: messageData.moduleId,
                    period: messageData.period,
                    dataSetIds: aggregateDataSetIds
                })
                .then(getDataValuesFromDhis)
                .then(getCompletionFromDhis)
                .then(getApprovalFromDhis)
                .then(mergeAndSaveModuleDataBlock)
                .then(getModuleDataBlock)
                .then(uploadModuleDataBlockToDhis);
            });
        };
    };
});
