define([], function() {
    return function($q, dataValuesConsumer, orgUnitConsumer) {
        this.run = function(message) {
            switch (message.data.type) {
                case "uploadDataValues":
                case "downloadDataValues":
                case "downloadApprovalData":
                case "uploadApprovalData":
                    return dataValuesConsumer.run(message);
                case "createOrgUnit":
                    return orgUnitConsumer.run(message);
                default:
                    return $q.reject();
            }
        };
    };
});