define([], function() {
    return function(approvalService, approvalDataRepository, datasetRepository, $q) {
        this.run = function(message) {
            var data = message.data.data;

            var invalidateApproval = function() {
                return approvalDataRepository.getApprovalData(data.pe, data.ou).then(function(approvalData) {
                    if (approvalData.status === "DELETED")
                        return approvalDataRepository.invalidateApproval(approvalData.period, approvalData.orgUnit);
                });
            };

            return datasetRepository.getAllDatasetIds().then(function(allDatasets) {
                var markAsIncompletePromise = approvalService.markAsIncomplete(allDatasets, data.pe, data.ou);
                var markAsUnapprovedPromise = approvalService.markAsUnapproved(allDatasets, data.pe, data.ou);
                return $q.all([markAsIncompletePromise, markAsUnapprovedPromise])
                    .then(invalidateApproval);
            });
        };
    };
});
