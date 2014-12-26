define([], function() {
    return function($q, orgUnitConsumer, orgUnitGroupConsumer, datasetConsumer, systemSettingConsumer, createUserConsumer, updateUserConsumer,
        downloadDataConsumer, uploadDataConsumer, uploadCompletionDataConsumer, uploadApprovalDataConsumer, programConsumer,
        downloadEventDataConsumer, uploadEventDataConsumer, deleteEventConsumer, downloadApprovalConsumer) {
        this.run = function(message) {
            switch (message.data.type) {
                case "downloadData":
                    return downloadDataConsumer.run(message).then(function() {
                        return downloadApprovalConsumer.run(message);
                    });
                case "uploadDataValues":
                    return downloadDataConsumer.run(message).then(function() {
                        return uploadDataConsumer.run(message);
                    });
                case "uploadCompletionData":
                    return downloadApprovalConsumer.run(message).then(function() {
                        return uploadCompletionDataConsumer.run(message);
                    });
                case "uploadApprovalData":
                    return downloadApprovalConsumer.run(message).then(function() {
                        return uploadApprovalDataConsumer.run(message);
                    });
                case "upsertOrgUnit":
                    return orgUnitConsumer.run(message);
                case "upsertOrgUnitGroups":
                    return orgUnitGroupConsumer.run(message);
                case "associateDataset":
                    return datasetConsumer.run(message);
                case "excludeDataElements":
                    return systemSettingConsumer.run(message);
                case "createUser":
                    return createUserConsumer.run(message);
                case "updateUser":
                    return updateUserConsumer.run(message);
                case "uploadProgram":
                    return programConsumer.run(message);
                case "uploadProgramEvents":
                    return downloadEventDataConsumer.run(message).then(function() {
                        return uploadEventDataConsumer.run(message);
                    });
                case "downloadEventData":
                    return downloadEventDataConsumer.run(message);
                case "deleteEvent":
                    return deleteEventConsumer.run(message);
                default:
                    return $q.reject();
            }
        };
    };
});