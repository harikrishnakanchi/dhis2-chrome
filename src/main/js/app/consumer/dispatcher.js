define(["lodash"], function (_) {
    return function ($q, $log, downloadOrgUnitConsumer, uploadOrgUnitConsumer, uploadOrgUnitGroupConsumer, downloadDatasetConsumer, uploadDatasetConsumer,
                     createUserConsumer, updateUserConsumer, downloadDataConsumer, uploadDataConsumer, uploadCompletionDataConsumer, uploadApprovalDataConsumer, uploadProgramConsumer,
                     downloadProgramConsumer, downloadEventDataConsumer, uploadEventDataConsumer, deleteEventConsumer, downloadApprovalConsumer, downloadMetadataConsumer,
                     downloadOrgUnitGroupConsumer, deleteApprovalConsumer, downloadSystemSettingConsumer, uploadPatientOriginConsumer, downloadChartConsumer,
                     uploadReferralLocationsConsumer, downloadPivotTableConsumer, downloadProjectSettingsConsumer, uploadExcludedDataElementsConsumer) {

        this.run = function (message) {
            $log.info("Processing message: " + message.data.type, message.data);
            switch (message.data.type) {
                case "downloadMetadata":
                    var downloadMetadataPromise = downloadMetadataConsumer.run(message);

                    var downloadSystemSettingPromise = downloadSystemSettingConsumer.run(message);

                    var downloadOrgUnitPromise = downloadOrgUnitConsumer.run(message);

                    var downloadOrgUnitGroupsPromise = downloadOrgUnitGroupConsumer.run(message);

                    var downloadProgramPromise = downloadProgramConsumer.run(message);

                    var downloadDatasetsPromise = downloadDatasetConsumer.run(message);

                    return $q.all([downloadMetadataPromise, downloadSystemSettingPromise, downloadOrgUnitPromise, downloadOrgUnitGroupsPromise, downloadProgramPromise, downloadDatasetsPromise]);


                case "downloadProjectData":
                    var downloadDataPromise = downloadDataConsumer.run(message)
                        .then(_.partial(downloadApprovalConsumer.run, message));

                    var downloadPivotTablesPromise = downloadPivotTableConsumer.run(message);

                    var downloadProjectSettingsPromise = downloadProjectSettingsConsumer.run(message);

                    var downloadChartsPromise = downloadChartConsumer.run(message);

                    var downloadEventDataPromise = downloadEventDataConsumer.run(message);

                    return $q.all([downloadDataPromise, downloadPivotTablesPromise, downloadProjectSettingsPromise, downloadChartsPromise, downloadEventDataPromise]);


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
                    return downloadEventDataConsumer.run(message)
                        .then(_.partial(uploadEventDataConsumer.run, message));

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
