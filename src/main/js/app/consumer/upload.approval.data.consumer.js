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
                if (payload.isApproved === true && payload.isAccepted === true)
                    return approvalService.markAsApproved(payload.dataSets, payload.period, payload.orgUnit, payload.createdByUsername, payload.createdDate)
                        .then(function() {
                            approvalService.markAsAccepted(payload.dataSets, payload.period, payload.orgUnit, payload.createdByUsername, payload.createdDate);
                        })
                        .then(clearStatusFlag);
                else if (payload.isApproved === true)
                    return approvalService.markAsApproved(payload.dataSets, payload.period, payload.orgUnit, payload.createdByUsername, payload.createdDate).then(clearStatusFlag);
            };

            var deleteApproval = function() {
                var deleteLocally = function() {
                    return approvalDataRepository.deleteLevelTwoApproval(payload.period, payload.orgUnit);
                };
                return approvalService.markAsUnapproved(payload.dataSets, payload.period, payload.orgUnit).then(deleteLocally);
            };

            var commands = {
                "NEW": createApproval,
                "DELETED": deleteApproval
            };

            var command = commands[payload.status] || function() {};
            return command.apply(this);
        };

        this.run = function(message) {
            return preparePayload(message.data.data).then(upload);
        };
    };
});
