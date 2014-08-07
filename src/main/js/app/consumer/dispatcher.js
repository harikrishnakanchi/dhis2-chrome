define([], function() {
    return function($q, orgUnitConsumer, datasetConsumer, systemSettingConsumer, createUserConsumer, updateUserConsumer, downloadDataConsumer, uploadDataConsumer, uploadCompletionDataConsumer, uploadApprovalDataConsumer) {
        this.run = function(message) {
            switch (message.data.type) {
                case "downloadData":
                    downloadDataConsumer.run(message);
                    break;
                case "uploadDataValues":
                    return downloadDataConsumer.run(message).then(function() {
                        return uploadDataConsumer.run(message);
                    });
                case "uploadCompletionData":
                    return downloadDataConsumer.run(message).then(function() {
                        return uploadCompletionDataConsumer.run(message);
                    });
                case "uploadApprovalData":
                    return downloadDataConsumer.run(message).then(function() {
                        return uploadApprovalDataConsumer.run(message);
                    });
                case "upsertOrgUnit":
                    return orgUnitConsumer.run(message);
                case "associateDataset":
                    return datasetConsumer.run(message);
                case "excludeDataElements":
                    return systemSettingConsumer.run(message);
                case "createUser":
                    return createUserConsumer.run(message);
                case "updateUser":
                    return updateUserConsumer.run(message);
                default:
                    return $q.reject();
            }
        };
    };
});