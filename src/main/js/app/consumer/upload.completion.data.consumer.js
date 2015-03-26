define(["moment", "properties", "lodash"], function(moment, properties, _) {
    return function(approvalService, approvalDataRepository, datasetRepository, $q) {
        this.run = function(message) {
            var periodsAndOrgUnits = _.isArray(message.data.data) ? message.data.data : [message.data.data];
            var getDatasetIdsPromise = datasetRepository.getAllDatasetIds();
            var getApprovalDataPromise = approvalDataRepository.getApprovalData(periodsAndOrgUnits);

            return $q.all([getDatasetIdsPromise, getApprovalDataPromise]).then(function(data) {
                var allDatasets = data[0];
                var allApprovalData = data[1];

                if (_.isEmpty(allApprovalData))
                    return;

                var clearStatusFlag = function() {
                    var promises = [];
                    _.each(allApprovalData, function(approvalData) {
                        if (!approvalData.isApproved)
                            promises.push(approvalDataRepository.clearStatusFlag(approvalData.period, approvalData.orgUnit));
                    });
                    return $q.all(promises);
                };

                var completedBy = allApprovalData[0].completedBy;
                var completedOn = allApprovalData[0].completedOn;
                var periodsAndOrgUnitsForDhis = _.transform(allApprovalData, function(results, approvalData) {
                    results.push({
                        "period": approvalData.period,
                        "orgUnit": approvalData.orgUnit
                    });
                });

                return approvalService.markAsComplete(allDatasets, periodsAndOrgUnitsForDhis, completedBy, completedOn)
                    .then(clearStatusFlag);
            });
        };
    };
});
