define([], function() {
    return function($q, downloadOrgUnitConsumer, uploadOrgUnitConsumer, uploadOrgUnitGroupConsumer, downloadDatasetConsumer, uploadDatasetConsumer, systemSettingConsumer, createUserConsumer, updateUserConsumer,
        downloadDataConsumer, uploadDataConsumer, uploadCompletionDataConsumer, uploadApprovalDataConsumer, uploadProgramConsumer, downloadProgramConsumer,
        downloadEventDataConsumer, uploadEventDataConsumer, deleteEventConsumer, downloadApprovalConsumer, downloadMetadataConsumer, downloadOrgUnitGroupConsumer, deleteApprovalConsumer) {
        this.run = function(message) {
            console.debug("Processing message: " + message.data.type);
            switch (message.data.type) {
                case "downloadMetadata":
                    return downloadMetadataConsumer.run(message);
                case "downloadData":
                    return downloadDataConsumer.run(message).then(function() {
                        return downloadApprovalConsumer.run(message);
                    });
                case "uploadDataValues":
                    return downloadDataConsumer.run(message).then(function() {
                        return uploadDataConsumer.run(message);
                    });
                case "uploadCompletionData":
                    return downloadDataConsumer.run(message).then(function() {
                        return downloadApprovalConsumer.run(message).then(function() {
                            return uploadCompletionDataConsumer.run(message);
                        });
                    });
                case "deleteApproval":
                    return deleteApprovalConsumer.run(message);
                case "uploadApprovalData":
                    return downloadDataConsumer.run(message).then(function() {
                        return downloadApprovalConsumer.run(message).then(function() {
                            return uploadApprovalDataConsumer.run(message);
                        });
                    });
                case "upsertOrgUnit":
                    return downloadOrgUnitConsumer.run(message).then(function() {
                        return uploadOrgUnitConsumer.run(message);
                    });
                case "downloadOrgUnit":
                    return downloadOrgUnitConsumer.run(message);
                case "upsertOrgUnitGroups":
                    return downloadOrgUnitGroupConsumer.run(message).then(function() {
                        return uploadOrgUnitGroupConsumer.run(message);
                    });
                case "downloadOrgUnitGroups":
                    return downloadOrgUnitGroupConsumer.run(message);
                case "downloadDatasets":
                    return downloadDatasetConsumer.run(message);
                case "associateDataset":
                    return uploadDatasetConsumer.run(message);
                case "excludeDataElements":
                    return systemSettingConsumer.run(message);
                case "createUser":
                    return createUserConsumer.run(message);
                case "updateUser":
                    return updateUserConsumer.run(message);
                case "downloadProgram":
                    return downloadProgramConsumer.run(message);
                case "uploadProgram":
                    return downloadProgramConsumer.run(message).then(function() {
                        return uploadProgramConsumer.run(message);
                    });
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
