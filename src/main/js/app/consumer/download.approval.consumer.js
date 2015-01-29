define(["moment", "properties", "lodash", "dateUtils"], function(moment, properties, _, dateUtils) {
    return function(dataSetRepository, userPreferenceRepository, $q, approvalService, approvalDataRepository) {
        var downloadApprovalData = function(metadata) {
            var userModuleIds = metadata[0];
            var allDataSetIds = metadata[1];

            if (userModuleIds.length === 0 || allDataSetIds.length === 0) return;

            var saveAllLevelTwoApprovalData = function(dhisApprovalDataList) {

                var mergeAndSaveCompletion = function(dbApprovalDataList) {

                    if (_.isEmpty(dhisApprovalDataList) && _.isEmpty(dbApprovalDataList))
                        return;

                    var l1UpdatePromises = [];
                    _.each(dbApprovalDataList, function(dbApprovalData) {
                        if (dbApprovalData.status === "NEW" || dbApprovalData.status === "DELETED")
                            return;

                        var dhisApprovalData = _.find(dhisApprovalDataList, {
                            "orgUnit": dbApprovalData.orgUnit,
                            "period": dbApprovalData.period
                        });

                        var l1UpdatePromise = dhisApprovalData ? approvalDataRepository.saveLevelTwoApproval(dhisApprovalData) : approvalDataRepository.deleteLevelTwoApproval(dbApprovalData.period, dbApprovalData.orgUnit);
                        l1UpdatePromises.push(l1UpdatePromise);
                    });

                    var newApprovals = _.reject(dhisApprovalDataList, function(dhisApprovalData) {
                        return _.any(dbApprovalDataList, {
                            "orgUnit": dhisApprovalData.orgUnit,
                            "period": dhisApprovalData.period
                        });
                    });
                    var approvalPromise = approvalDataRepository.saveLevelTwoApproval(newApprovals);
                    l1UpdatePromises.push(approvalPromise);

                    return $q.all(l1UpdatePromises);
                };

                var m = moment();
                var startPeriod = dateUtils.toDhisFormat(m.isoWeek(m.isoWeek() - properties.projectDataSync.numWeeksToSync + 1));
                var endPeriod = dateUtils.toDhisFormat(moment());

                var moduleIds = _.unique(_.pluck(dhisApprovalDataList, "orgUnit"));

                return approvalDataRepository.getLevelTwoApprovalDataForPeriodsOrgUnits(startPeriod, endPeriod, moduleIds).then(mergeAndSaveCompletion);
            };

            return approvalService.getAllLevelTwoApprovalData(userModuleIds, allDataSetIds).then(saveAllLevelTwoApprovalData);
        };

        var downloadCompletionData = function(metadata) {
            var userModuleIds = metadata[0];
            var allDataSetIds = metadata[1];

            if (userModuleIds.length === 0 || allDataSetIds.length === 0) return;

            var saveAllLevelOneApprovalData = function(dhisApprovalDataList) {

                var mergeAndSaveCompletion = function(dbApprovalDataList) {

                    if (_.isEmpty(dhisApprovalDataList) && _.isEmpty(dbApprovalDataList))
                        return;

                    var l1UpdatePromises = [];
                    _.each(dbApprovalDataList, function(dbApprovalData) {
                        if (dbApprovalData.status === "NEW" || dbApprovalData.status === "DELETED")
                            return;

                        var dhisApprovalData = _.find(dhisApprovalDataList, {
                            "orgUnit": dbApprovalData.orgUnit,
                            "period": dbApprovalData.period
                        });

                        var l1UpdatePromise = dhisApprovalData ? approvalDataRepository.saveLevelOneApproval(dhisApprovalData) : approvalDataRepository.deleteLevelOneApproval(dbApprovalData.period, dbApprovalData.orgUnit);
                        l1UpdatePromises.push(l1UpdatePromise);
                    });

                    var newApprovals = _.reject(dhisApprovalDataList, function(dhisApprovalData) {
                        return _.any(dbApprovalDataList, {
                            "orgUnit": dhisApprovalData.orgUnit,
                            "period": dhisApprovalData.period
                        });
                    });

                    var approvalPromise = approvalDataRepository.saveLevelOneApproval(newApprovals);
                    l1UpdatePromises.push(approvalPromise);

                    return $q.all(l1UpdatePromises);
                };

                var m = moment();
                var startPeriod = dateUtils.toDhisFormat(m.isoWeek(m.isoWeek() - properties.projectDataSync.numWeeksToSync + 1));
                var endPeriod = dateUtils.toDhisFormat(moment());

                var moduleIds = _.unique(_.pluck(dhisApprovalDataList, "orgUnit"));

                return approvalDataRepository.getLevelOneApprovalDataForPeriodsOrgUnits(startPeriod, endPeriod, moduleIds).then(mergeAndSaveCompletion);
            };

            return approvalService.getAllLevelOneApprovalData(userModuleIds, allDataSetIds).then(saveAllLevelOneApprovalData);
        };

        this.run = function() {
            return $q.all([userPreferenceRepository.getUserModuleIds(), dataSetRepository.getAllDatasetIds()]).then(function(metadata) {
                return $q.all([downloadCompletionData(metadata), downloadApprovalData(metadata)]);
            });
        };
    };
});
