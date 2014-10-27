define(["lodash", "datasetTransformer"], function(_, datasetTransformer) {
    var generateBulkApprovalData = function(periodsToApprovePerModule, allDatasets, storedByUsername) {
        var modulesToApprove = _.pluck(periodsToApprovePerModule, "orgUnitId");

        var approvalData = _.map(modulesToApprove, function(moduleId, i) {
            var associatedDatasets = _.pluck(datasetTransformer.getAssociatedDatasets(moduleId, allDatasets), 'id');
            return _.map(periodsToApprovePerModule[i].period, function(pe) {
                return {
                    "dataSets": associatedDatasets,
                    "period": pe,
                    "orgUnit": moduleId,
                    "storedBy": storedByUsername
                };
            });
        });
        return _.flatten(approvalData);
    };

    return {
        "generateBulkApprovalData": generateBulkApprovalData
    };
});