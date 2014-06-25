define([], function() {
    return function(dataValuesConsumer, orgUnitConsumer) {
        this.run = function(message) {
            switch (message.data.type) {
                case "uploadDataValues":
                case "downloadDataValues":
                case "downloadApprovalData":
                case "uploadApprovalData":
                    return dataValuesConsumer.run(message);
                case "createOrgUnit":
                    return orgUnitConsumer.run(message);
            }
        };
    };
});