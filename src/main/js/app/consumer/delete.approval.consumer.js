define(["lodash"], function(_) {
    return function(approvalService, approvalDataRepository, datasetRepository, $q) {
        this.run = function(message) {
            var periodAndOrgUnit = message.data.data;

            var invalidateApproval = function() {
                return approvalDataRepository.getApprovalData(periodAndOrgUnit).then(function(approvalData) {
                    if (approvalData.status === "DELETED")
                        return approvalDataRepository.invalidateApproval(approvalData.period, approvalData.orgUnit);
                });
            };

            return datasetRepository.getAll().then(function(allDatasets) {
                var allDatasetIds = _.pluck(allDatasets, "id");
                var markAsIncompletePromise = approvalService.markAsIncomplete(allDatasetIds, periodAndOrgUnit.period, periodAndOrgUnit.orgUnit);
                var markAsUnapprovedPromise = approvalService.markAsUnapproved(allDatasetIds, periodAndOrgUnit.period, periodAndOrgUnit.orgUnit);
                return $q.all([markAsIncompletePromise, markAsUnapprovedPromise])
                    .then(invalidateApproval);
            });
        };
    };
});
