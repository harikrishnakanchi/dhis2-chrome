define(["moment", "properties", "lodash"], function(moment, properties, _) {
    return function(approvalService, approvalDataRepository) {

        var preparePayload = function(data) {
            return approvalDataRepository.getLevelTwoApprovalData(data.period, data.orgUnit);
        };

        var upload = function(payload) {
            if (!payload)
                return;

            return approvalService.markAsApproved(payload.dataSets, payload.period, payload.orgUnit);
        };

        this.run = function(message) {
            return preparePayload(message.data.data).then(upload);
        };
    };
});