define(["lodash"], function(_) {
    return function($q, $log, downloadOrgUnitConsumer, uploadOrgUnitConsumer, uploadOrgUnitGroupConsumer, downloadDatasetConsumer, uploadDatasetConsumer,
        createUserConsumer, updateUserConsumer, downloadDataConsumer, uploadDataConsumer, uploadCompletionDataConsumer, uploadApprovalDataConsumer, uploadProgramConsumer,
        downloadProgramConsumer, downloadEventDataConsumer, uploadEventDataConsumer, deleteEventConsumer, downloadApprovalConsumer, downloadMetadataConsumer,
        downloadOrgUnitGroupConsumer, deleteApprovalConsumer, downloadSystemSettingConsumer, uploadSystemSettingConsumer, uploadPatientOriginConsumer, downloadChartConsumer,
        uploadReferralLocationsConsumer, downloadPivotTableConsumer, downloadProjectSettingsConsumer, uploadExcludedDataElementsConsumer) {

        this.run = function(message) {
            $log.info("Processing message: " + message.data.type, message.data);
            switch (message.data.type) {
                case "downloadMetadata":
                    return downloadMetadataConsumer.run(message);

                case "downloadData":
                    return downloadDataConsumer.run(message)
                        .then(_.partial(downloadApprovalConsumer.run, message));

                case "uploadDataValues":
                    return downloadDataConsumer.run(message)
                        .then(_.partial(uploadDataConsumer.run, message));

                case "uploadCompletionData":
                    return downloadDataConsumer.run(message)
                        .then(_.partial(downloadApprovalConsumer.run, message))
                        .then(_.partial(uploadCompletionDataConsumer.run, message));

                case "deleteApprovals":
                    return deleteApprovalConsumer.run(message);

                case "uploadApprovalData":
                    return downloadDataConsumer.run(message)
                        .then(_.partial(downloadApprovalConsumer.run, message))
                        .then(_.partial(uploadApprovalDataConsumer.run, message));

                case "upsertOrgUnit":
                    return downloadOrgUnitConsumer.run(message)
                        .then(_.partial(uploadOrgUnitConsumer.run, message));

                case "downloadOrgUnit":
                    return downloadOrgUnitConsumer.run(message);

                case "upsertOrgUnitGroups":
                    return downloadOrgUnitGroupConsumer.run(message)
                        .then(_.partial(uploadOrgUnitGroupConsumer.run, message));

                case "downloadOrgUnitGroups":
                    return downloadOrgUnitGroupConsumer.run(message);

                case "downloadDatasets":
                    return downloadDatasetConsumer.run(message);

                case "associateOrgUnitToDataset":
                    return downloadDatasetConsumer.run()
                        .then(_.partial(uploadDatasetConsumer.run, message));

                case "createUser":
                    return createUserConsumer.run(message);

                case "updateUser":
                    return updateUserConsumer.run(message);

                case "downloadProgram":
                    return downloadProgramConsumer.run(message);

                case "uploadProgram":
                    return downloadProgramConsumer.run(message)
                        .then(_.partial(uploadProgramConsumer.run, message));

                case "uploadProgramEvents":
                    return downloadEventDataConsumer.run(message)
                        .then(_.partial(uploadEventDataConsumer.run, message));

                case "downloadEventData":
                    return downloadEventDataConsumer.run(message);

                case "deleteEvent":
                    return deleteEventConsumer.run(message);

                case "downloadSystemSetting":
                    return downloadSystemSettingConsumer.run(message);

                case "downloadProjectSettings":
                    return downloadProjectSettingsConsumer.run(message);

                case "uploadSystemSetting":
                    return downloadSystemSettingConsumer.run(message)
                        .then(_.partial(uploadSystemSettingConsumer.run, message));

                case "uploadPatientOriginDetails":
                    return uploadPatientOriginConsumer.run(message);

                case "downloadCharts":
                    return downloadChartConsumer.run(message);

                case "uploadReferralLocations":
                    return uploadReferralLocationsConsumer.run(message);

                case "uploadExcludedDataElements":
                    return uploadExcludedDataElementsConsumer.run(message);

                case "downloadPivotTables":
                    return downloadPivotTableConsumer.run(message);

                default:
                    return $q.reject();
            }
        };
    };
});
