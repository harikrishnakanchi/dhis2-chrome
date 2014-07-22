define(["moment", "properties", "lodash"], function(moment, properties, _) {
    return function(approvalService, approvalDataRepository) {

        var preparePayload = function(data) {
            return approvalDataRepository.getLevelTwoApprovalData(data.period, data.orgUnit);
        };

        var upload = function(payload) {
            if (!payload) return;

            var createApproval = function() {
                var clearStatusFlag = function() {
                    return approvalDataRepository.saveLevelTwoApproval(_.omit(payload, "status"));
                };
                return approvalService.markAsApproved(payload.dataSets, payload.period, payload.orgUnit, payload.createdByUsername, payload.createdDate).then(clearStatusFlag);
            };

            var deleteApproval = function() {
                var deleteLocally = function() {
                    return approvalDataRepository.deleteLevelTwoApproval(payload.period, payload.orgUnit);
                };
                return approvalService.markAsUnapproved(payload.dataSets, payload.period, payload.orgUnit, payload.createdByUsername, payload.createdDate).then(deleteLocally);
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