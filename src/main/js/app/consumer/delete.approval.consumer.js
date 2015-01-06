define([], function() {
    return function(approvalService, $q) {
        this.run = function(message) {
            var data = message.data.data;
            return $q.all([approvalService.markAsUnapproved(data.ds, data.pe, data.ou),
                approvalService.markAsIncomplete(data.ds, data.pe, data.ou)
            ]);
        };
    };
});
