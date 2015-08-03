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
                return approvalService.markAsIncomplete(allDatasetIds, periodsAndOrgUnits).then(function(data) {
                    return allDatasetIds;
                });
            };

            var markAsUnapproved = function(allDatasetIds) {
                return approvalService.markAsUnapproved(allDatasetIds, periodsAndOrgUnits).then(function(data) {
                    return allDatasetIds;
                });
            };

            var getDatasets = function() {
                return datasetRepository.getAll().then(function(allDatasets) {
                    return _.pluck(allDatasets, "id");
                });
            };

            return getDatasets()
                .then(markAsUnapproved)
                .then(markAsIncomplete)
                .then(invalidateApproval);
        };
    };
});
