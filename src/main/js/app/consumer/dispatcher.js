define([], function() {
    return function($q, dataValuesConsumer, orgUnitConsumer, datasetConsumer) {
        this.run = function(message) {
            switch (message.data.type) {
                case "uploadDataValues":
                case "downloadDataValues":
                case "downloadApprovalData":
                case "uploadApprovalData":
                    return dataValuesConsumer.run(message);
                case "createOrgUnit":
                    return orgUnitConsumer.run(message);
                case "associateDataset":
                    return datasetConsumer.run(message);
                default:
                    return $q.reject();
            }
        };
    };
});