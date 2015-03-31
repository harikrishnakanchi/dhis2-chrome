define(["moment", "properties", "lodash", "dateUtils"], function(moment, properties, _, dateUtils) {
    return function(datasetRepository, userPreferenceRepository, $q, approvalService, approvalDataRepository) {

        var getMetadata = function() {
            return $q.all([userPreferenceRepository.getUserModuleIds(), datasetRepository.getAllDatasetIds()]);
        };

        var getCompletionAndApprovalData = function(metadata) {
            var userModuleIds = metadata[0];
            var allDataSetIds = metadata[1];

            if (userModuleIds.length === 0 || allDataSetIds.length === 0)
                return;

            var m = moment();
            var startPeriod = dateUtils.toDhisFormat(m.isoWeek(m.isoWeek() - properties.projectDataSync.numWeeksToSync + 1));
            var endPeriod = dateUtils.toDhisFormat(moment());

            var getDhisCompletionDataPromise = approvalService.getCompletionData(userModuleIds, allDataSetIds);
            var getDhisApprovalDataPromise = approvalService.getApprovalData(userModuleIds, allDataSetIds);
            var getApprovalDataPromise = approvalDataRepository.getApprovalDataForPeriodsOrgUnits(startPeriod, endPeriod, userModuleIds);

            return $q.all([getDhisCompletionDataPromise, getDhisApprovalDataPromise, getApprovalDataPromise]);
        };

        var saveCompletionAndApprovalData = function(data) {
            if (!data)
                return;

            var dhisCompletionList = data[0];
            var dhisApprovalList = data[1];
            var dbApprovalList = data[2];

            var approvalUpsertPromises = [];

            var mergedDhisCompletionAndApprovalList = _.map(dhisCompletionList, function(dhisCompletionData) {
                var dhisApprovalData = _.find(dhisApprovalList, _.matches({
                    "period": dhisCompletionData.period,
                    "orgUnit": dhisCompletionData.orgUnit
                }));
                if (dhisApprovalData)
                    return _.merge(dhisCompletionData, dhisApprovalData);
                return dhisCompletionData;
            });

            var newApprovals = _.reject(mergedDhisCompletionAndApprovalList, function(dhisApprovalData) {
                return _.any(dbApprovalList, {
                    "orgUnit": dhisApprovalData.orgUnit,
                    "period": dhisApprovalData.period
                });
            });

            if (!_.isEmpty(newApprovals))
                approvalUpsertPromises.push(approvalDataRepository.saveApprovalsFromDhis(newApprovals));

            _.each(dbApprovalList, function(dbApproval) {
                if (dbApproval.status === "NEW" || dbApproval.status === "DELETED")
                    return;

                var dhisApprovalData = _.find(mergedDhisCompletionAndApprovalList, {
                    "orgUnit": dbApproval.orgUnit,
                    "period": dbApproval.period
                });

                var l1UpdatePromise = dhisApprovalData ? approvalDataRepository.saveApprovalsFromDhis(dhisApprovalData) : approvalDataRepository.invalidateApproval(dbApproval.period, dbApproval.orgUnit);
                approvalUpsertPromises.push(l1UpdatePromise);
            });

            return $q.all(approvalUpsertPromises);
        };

        this.run = function() {
            return getMetadata()
                .then(getCompletionAndApprovalData)
                .then(saveCompletionAndApprovalData);
        };
    };
});
