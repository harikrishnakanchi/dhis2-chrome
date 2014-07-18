define(["moment", "properties", "lodash"], function(moment, properties, _) {
    return function(approvalService, approvalDataRepository) {
        var preparePayload = function(data) {
            return approvalDataRepository.getLevelOneApprovalData(data.period, data.orgUnit);
        };

        var upload = function(payload) {
            if (!payload)
                return;
            if (payload.status === "NEW")
                return approvalService.markAsComplete(payload.dataSets, payload.period, payload.orgUnit, payload.storedBy, payload.date);
            if (payload.status === "DELETED")
                return approvalService.markAsIncomplete(payload.dataSets, payload.period, payload.orgUnit);
        };

        this.run = function(message) {
            return preparePayload(message.data.data).then(upload);
        };
    };
});