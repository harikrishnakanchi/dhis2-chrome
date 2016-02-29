define(["lodash"], function(_) {
    return function($q, $log, downloadOrgUnitConsumer, uploadOrgUnitConsumer, uploadOrgUnitGroupConsumer, downloadDatasetConsumer, uploadDatasetConsumer,
        createUserConsumer, updateUserConsumer, downloadDataConsumer, uploadDataConsumer, uploadCompletionDataConsumer, uploadApprovalDataConsumer, uploadProgramConsumer,
        downloadProgramConsumer, downloadEventDataConsumer, uploadEventDataConsumer, deleteEventConsumer, downloadApprovalConsumer, downloadMetadataConsumer,
        downloadOrgUnitGroupConsumer, deleteApprovalConsumer, downloadSystemSettingConsumer, uploadPatientOriginConsumer, downloadPivotTableDataConsumer, downloadChartDataConsumer,
        uploadReferralLocationsConsumer, downloadProjectSettingsConsumer, uploadExcludedDataElementsConsumer, downloadChartsConsumer, downloadPivotTablesConsumer, userPreferenceRepository) {

        this.run = function(message) {
            $log.info("Processing message: " + message.data.type, message.data);
            switch (message.data.type) {
                case "downloadMetadata":
                    return downloadMetadataConsumer.run(message)
                        .then(_.partial(downloadSystemSettingConsumer.run, message))
                        .then(_.partial(downloadOrgUnitConsumer.run, message))
                        .then(_.partial(downloadOrgUnitGroupConsumer.run, message))
                        .then(_.partial(downloadProgramConsumer.run, message))
                        .then(_.partial(downloadDatasetConsumer.run, message))
                        .then(function() {
                            $log.info('Metadata sync complete');
                        });

                case "downloadProjectData":
                    return downloadProjectSettingsConsumer.run(message)
                        .then(userPreferenceRepository.getCurrentUsersUsername)
                        .then(function(currentUsersUsername) {
                            if(currentUsersUsername == 'superadmin' || currentUsersUsername == 'projectadmin') {
                                $log.info('Project data sync complete');
                                return;
                            }
                            return downloadDataConsumer.run(message)
                                .then(_.partial(downloadApprovalConsumer.run, message))
                                .then(_.partial(downloadEventDataConsumer.run, message))
                                .then(_.partial(downloadChartsConsumer.run, message))
                                .then(_.partial(downloadChartDataConsumer.run, message))
                                .then(_.partial(downloadPivotTablesConsumer.run, message))
                                .then(_.partial(downloadPivotTableDataConsumer.run, message))
                                .then(function() {
                                    $log.info('Project data sync complete');
                                });
                        });

                case "downloadProjectDataForAdmin":
                    return downloadProjectSettingsConsumer.run(message);

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

                case "upsertOrgUnitGroups":
                    return downloadOrgUnitGroupConsumer.run(message)
                        .then(_.partial(uploadOrgUnitGroupConsumer.run, message));

                case "associateOrgUnitToDataset":
                    return downloadDatasetConsumer.run()
                        .then(_.partial(uploadDatasetConsumer.run, message));

                case "createUser":
                    return createUserConsumer.run(message);

                case "updateUser":
                    return updateUserConsumer.run(message);

                case "uploadProgram":
                    return downloadProgramConsumer.run(message)
                        .then(_.partial(uploadProgramConsumer.run, message));

                case "uploadProgramEvents":
                    return uploadEventDataConsumer.run(message);

                case "deleteEvent":
                    return deleteEventConsumer.run(message);

                case "uploadPatientOriginDetails":
                    return uploadPatientOriginConsumer.run(message);

                case "uploadReferralLocations":
                    return uploadReferralLocationsConsumer.run(message);

                case "uploadExcludedDataElements":
                    return uploadExcludedDataElementsConsumer.run(message);

                default:
                    return $q.reject();
            }
        };
    };
});