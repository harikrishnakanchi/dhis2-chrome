define(["lodash"], function(_) {
    return function($q, $log, downloadOrgUnitConsumer, uploadOrgUnitConsumer, uploadOrgUnitGroupConsumer, downloadDataSetConsumer, assignDataSetsToOrgUnitsConsumer,
        createUserConsumer, updateUserConsumer, uploadProgramConsumer,
        downloadProgramConsumer, downloadMetadataConsumer,
        downloadOrgUnitGroupConsumer, downloadSystemSettingConsumer, uploadPatientOriginConsumer, downloadPivotTableDataConsumer, downloadChartDataConsumer,
        uploadReferralLocationsConsumer, downloadProjectSettingsConsumer, uploadExcludedDataElementsConsumer, downloadChartsConsumer, downloadPivotTablesConsumer, userPreferenceRepository,
        downloadModuleDataBlocksConsumer, syncModuleDataBlockConsumer, removeOrgunitDataSetAssociationConsumer, associateOrgunitToProgramConsumer, syncExcludedLinelistOptionsConsumer, downloadHistoricalDataConsumer) {

        this.run = function(message) {
            $log.info("Processing message: " + message.data.type, message.data);
            switch (message.data.type) {
                case "downloadMetadata":
                    return downloadMetadataConsumer.run(message)
                        .then(_.partial(downloadSystemSettingConsumer.run, message))
                        .then(_.partial(downloadOrgUnitConsumer.run, message))
                        .then(_.partial(downloadOrgUnitGroupConsumer.run, message))
                        .then(_.partial(downloadProgramConsumer.run, message))
                        .then(_.partial(downloadDataSetConsumer.run, message))
                        .then(function() {
                            $log.info('Metadata sync complete');
                        });

                case "downloadProjectData":
                    return downloadProjectSettingsConsumer.run(message)
                        .then(userPreferenceRepository.getCurrentUsersUsername)
                        .then(function(currentUsersUsername) {
                            if(currentUsersUsername == 'superadmin' || currentUsersUsername == 'projectadmin' || currentUsersUsername === null) {
                                $log.info('Project data sync complete');
                                return;
                            }
                            return downloadModuleDataBlocksConsumer.run()
                                .then(_.partial(downloadChartsConsumer.run, message))
                                .then(_.partial(downloadChartDataConsumer.run, message))
                                .then(_.partial(downloadPivotTablesConsumer.run, message))
                                .then(_.partial(downloadPivotTableDataConsumer.run, message))
                                .then(_.partial(downloadHistoricalDataConsumer.run, message))
                                .then(function() {
                                    $log.info('Project data sync complete');
                                });
                        });

                case "downloadProjectDataForAdmin":
                    return downloadProjectSettingsConsumer.run(message);

                case "syncModuleDataBlock":
                    return syncModuleDataBlockConsumer.run(message);

                case "upsertOrgUnit":
                    return downloadOrgUnitConsumer.run(message)
                        .then(_.partial(uploadOrgUnitConsumer.run, message));

                case "upsertOrgUnitGroups":
                    return uploadOrgUnitGroupConsumer.run(message);

                case "associateOrgUnitToDataset":
                    return assignDataSetsToOrgUnitsConsumer.run(message);

                case "removeOrgUnitFromDataset":
                    return removeOrgunitDataSetAssociationConsumer.run(message);
                
                case "associateOrgunitToProgram":
                    return associateOrgunitToProgramConsumer.run(message);

                case "createUser":
                    return createUserConsumer.run(message);

                case "updateUser":
                    return updateUserConsumer.run(message);

                case "uploadProgram":
                    return downloadProgramConsumer.run(message)
                        .then(_.partial(uploadProgramConsumer.run, message));

                case "uploadPatientOriginDetails":
                    return uploadPatientOriginConsumer.run(message);

                case "uploadReferralLocations":
                    return uploadReferralLocationsConsumer.run(message);

                case "uploadExcludedDataElements":
                    return uploadExcludedDataElementsConsumer.run(message);

                case "uploadExcludedOptions":
                    return syncExcludedLinelistOptionsConsumer.run(message);

                default:
                    return $q.reject();
            }
        };
    };
});