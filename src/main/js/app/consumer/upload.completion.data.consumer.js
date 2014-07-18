define(["moment", "properties", "lodash"], function(moment, properties, _) {
    return function(approvalService, approvalDataRepository) {
        var preparePayload = function(data) {
            return approvalDataRepository.getLevelOneApprovalData(data.period, data.orgUnit);
        };



        var upload = function(payload) {
            if (!payload) return;

            var createApproval = function() {
                var clearStatusFlag = function() {
                    return approvalDataRepository.saveLevelOneApproval(_.omit(payload, "status"));
                };
                return approvalService.markAsComplete(payload.dataSets, payload.period, payload.orgUnit, payload.storedBy, payload.date).then(clearStatusFlag);
            };

            var deleteApproval = function() {
                var deleteLocally = function() {
                    return approvalDataRepository.deleteLevelOneApproval(payload.period, payload.orgUnit);
                };
                return approvalService.markAsIncomplete(payload.dataSets, payload.period, payload.orgUnit).then(deleteLocally);
            };

            var commands = {
                "NEW": createApproval,
                "DELETED": deleteApproval
            };

            var command = commands[payload.status] || function() {};
            command.apply(this);
        };

        this.run = function(message) {
            return preparePayload(message.data.data).then(upload);
        };
    };
});