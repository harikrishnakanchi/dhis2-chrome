define([], function() {
    return function(approvalService, approvalDataRepository, $q) {
        this.run = function(message) {
            var data = message.data.data;

            var modifyCompleteDataSets = function() {
                return approvalDataRepository.getLevelOneApprovalData(data.pe, data.ou).then(function(data) {
                    return approvalDataRepository.saveLevelOneApproval(_.omit(data, 'status'));
                });
            };

            var modifyApprovedDataSets = function() {
                return approvalDataRepository.getLevelTwoApprovalData(data.pe, data.ou).then(function(data) {
                    return approvalDataRepository.saveLevelTwoApproval(_.omit(data, 'status'));
                });
            };

            return $q.all([approvalService.markAsUnapproved(data.ds, data.pe, data.ou),
                approvalService.markAsIncomplete(data.ds, data.pe, data.ou)
            ]).then(modifyCompleteDataSets).then(modifyApprovedDataSets);
        };
    };
});
