define(["lodash"], function(_) {
    return function(approvalService, approvalDataRepository, datasetRepository, $q) {
        this.run = function(message) {
            var periodAndOrgUnit = message.data.data;

            var invalidateApproval = function() {
                return approvalDataRepository.getApprovalData(periodAndOrgUnit).then(function(approvalData) {
                    if (approvalData && approvalData.status === "DELETED")
                        return approvalDataRepository.invalidateApproval(approvalData.period, approvalData.orgUnit);
                });
            };

            var markAsIncomplete = function(allDatasetIds){
                return approvalService.markAsIncomplete(allDatasetIds, periodAndOrgUnit.period, periodAndOrgUnit.orgUnit);
            };

            var markAsUnapproved = function(allDatasetIds){
                return approvalService.markAsUnapproved(allDatasetIds, periodAndOrgUnit.period, periodAndOrgUnit.orgUnit).then(function(data){
                    return allDatasetIds;
                });
            };

            return datasetRepository.getAll().then(function(allDatasets) {
                var allDatasetIds = _.pluck(allDatasets, "id");
                return markAsUnapproved(allDatasetIds).then(markAsIncomplete).then(invalidateApproval);
            });
        };
    };
});
