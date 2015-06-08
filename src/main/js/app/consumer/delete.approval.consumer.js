define(["lodash"], function(_) {
    return function(approvalService, approvalDataRepository, datasetRepository, $q) {
        this.run = function(message) {
            var periodsAndOrgUnits = _.isArray(message.data.data) ? message.data.data : [message.data.data];

            var invalidateApproval = function() {
                return approvalDataRepository.getApprovalData(periodsAndOrgUnits).then(function(approvalData) {
                    if (!_.isEmpty(approvalData)) {
                        var invalidateApprovalPromises = _.map(approvalData, function(approvalDatum) {
                            if (approvalDatum.status === "DELETED")
                                return approvalDataRepository.invalidateApproval(approvalDatum.period, approvalDatum.orgUnit);
                        });
                        return $q.all(invalidateApprovalPromises);
                    }
                });
            };

            var markAsIncomplete = function(allDatasetIds) {
                return approvalService.markAsIncomplete(allDatasetIds, periodsAndOrgUnits);
            };

            var markAsUnapproved = function(allDatasetIds) {
                return approvalService.markAsUnapproved(allDatasetIds, periodsAndOrgUnits).then(function(data) {
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
