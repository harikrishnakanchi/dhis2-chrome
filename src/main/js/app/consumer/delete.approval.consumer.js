define([], function() {
    return function(approvalService, approvalDataRepository, datasetRepository, $q) {
        this.run = function(message) {
            var periodAndOrgUnit = message.data.data;

            var invalidateApproval = function() {
                return approvalDataRepository.getApprovalData(periodAndOrgUnit).then(function(approvalData) {
                    if (approvalData.status === "DELETED")
                        return approvalDataRepository.invalidateApproval(approvalData.period, approvalData.orgUnit);
                });
            };

            return datasetRepository.getAllDatasetIds().then(function(allDatasets) {
                var markAsIncompletePromise = approvalService.markAsIncomplete(allDatasets, periodAndOrgUnit.period, periodAndOrgUnit.orgUnit);
                var markAsUnapprovedPromise = approvalService.markAsUnapproved(allDatasets, periodAndOrgUnit.period, periodAndOrgUnit.orgUnit);
                return $q.all([markAsIncompletePromise, markAsUnapprovedPromise])
                    .then(invalidateApproval);
            });
        };
    };
});
