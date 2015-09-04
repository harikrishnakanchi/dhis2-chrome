define(["uploadApprovalDataConsumer", "downloadOrgUnitConsumer", "uploadOrgUnitConsumer", "uploadOrgUnitGroupConsumer", "downloadDatasetConsumer", "uploadDatasetConsumer",
        "createUserConsumer", "updateUserConsumer", "dispatcher", "consumerRegistry", "downloadDataConsumer", "uploadDataConsumer", "uploadCompletionDataConsumer",
        "orgUnitRepository", "programRepository", "uploadProgramConsumer", "downloadProgramConsumer", "downloadEventDataConsumer", "deleteEventConsumer", "eventService", "programEventRepository",
        "uploadEventDataConsumer", "downloadApprovalConsumer", "downloadMetadataConsumer", "downloadOrgUnitGroupConsumer", "deleteApprovalConsumer", "downloadSystemSettingConsumer", "metadataService",
        "metadataRepository", "uploadPatientOriginConsumer", "mergeBy", "downloadChartConsumer", "excludedDataElementsRepository", "uploadExcludedDataElementsConsumer", "uploadReferralLocationsConsumer",
        "referralLocationsRepository", "downloadPivotTableConsumer", "downloadProjectSettingsConsumer"
    ],
    function(uploadApprovalDataConsumer, downloadOrgUnitConsumer, uploadOrgUnitConsumer, uploadOrgUnitGroupConsumer, downloadDatasetConsumer, uploadDatasetConsumer, createUserConsumer,
        updateUserConsumer, dispatcher, consumerRegistry, downloadDataConsumer, uploadDataConsumer, uploadCompletionDataConsumer, orgUnitRepository, programRepository, uploadProgramConsumer,
        downloadProgramConsumer, downloadEventDataConsumer, deleteEventConsumer, eventService, programEventRepository, uploadEventDataConsumer, downloadApprovalConsumer, downloadMetadataConsumer,
        downloadOrgUnitGroupConsumer, deleteApprovalConsumer, downloadSystemSettingConsumer, metadataService, metadataRepository, uploadPatientOriginConsumer, mergeBy, downloadChartConsumer,
        excludedDataElementsRepository, uploadExcludedDataElementsConsumer, uploadReferralLocationsConsumer, referralLocationsRepository, downloadPivotTableConsumer, downloadProjectSettingsConsumer) {

        var init = function(app) {
            app.service('mergeBy', ['$log', mergeBy]);
            app.service("downloadDataConsumer", ["dataService", "dataRepository", "datasetRepository", "userPreferenceRepository", "$q", "approvalDataRepository", "mergeBy", downloadDataConsumer]);
            app.service("downloadApprovalConsumer", ["datasetRepository", "userPreferenceRepository", "orgUnitRepository", "$q", "approvalService", "approvalDataRepository", downloadApprovalConsumer]);
            app.service("uploadDataConsumer", ["dataService", "dataRepository", uploadDataConsumer]);
            app.service("uploadCompletionDataConsumer", ["approvalService", "approvalDataRepository", "datasetRepository", "$q", uploadCompletionDataConsumer]);
            app.service("uploadApprovalDataConsumer", ["approvalService", "approvalDataRepository", "datasetRepository", "$q", uploadApprovalDataConsumer]);
            app.service("downloadOrgUnitConsumer", ["orgUnitService", "orgUnitRepository", "changeLogRepository", "$q", "mergeBy", downloadOrgUnitConsumer]);
            app.service("uploadOrgUnitConsumer", ["orgUnitService", "orgUnitRepository", "$q", uploadOrgUnitConsumer]);
            app.service("downloadOrgUnitGroupConsumer", ["orgUnitGroupService", "orgUnitGroupRepository", "changeLogRepository", "$q", "mergeBy", downloadOrgUnitGroupConsumer]);
            app.service("uploadOrgUnitGroupConsumer", ["orgUnitGroupService", "orgUnitGroupRepository", "$q", uploadOrgUnitGroupConsumer]);
            app.service("downloadDatasetConsumer", ["datasetService", "datasetRepository", "$q", "changeLogRepository", "mergeBy", downloadDatasetConsumer]);
            app.service("uploadDatasetConsumer", ["datasetService", "datasetRepository", uploadDatasetConsumer]);
            app.service("createUserConsumer", ["userService", createUserConsumer]);
            app.service("updateUserConsumer", ["userService", updateUserConsumer]);
            app.service("downloadSystemSettingConsumer", ["systemSettingService", "systemSettingRepository", "mergeBy", downloadSystemSettingConsumer]);
            app.service("downloadProjectSettingsConsumer", ["$q", "systemSettingService", "userPreferenceRepository", "referralLocationsRepository", "patientOriginRepository", "excludedDataElementsRepository", downloadProjectSettingsConsumer]);
            app.service("consumerRegistry", ["$hustle", "$q", "$log", "dispatcher", consumerRegistry]);
            app.service("uploadProgramConsumer", ["programService", "programRepository", "$q", uploadProgramConsumer]);
            app.service("downloadProgramConsumer", ["programService", "programRepository", "changeLogRepository", "$q", "mergeBy", downloadProgramConsumer]);
            app.service("downloadEventDataConsumer", ["eventService", "programEventRepository", "userPreferenceRepository", "$q", downloadEventDataConsumer]);
            app.service("uploadEventDataConsumer", ["eventService", "programEventRepository", "$q", uploadEventDataConsumer]);
            app.service("deleteEventConsumer", ["eventService", "programEventRepository", "$q", deleteEventConsumer]);
            app.service("downloadMetadataConsumer", ["metadataService", "metadataRepository", "changeLogRepository", downloadMetadataConsumer]);
            app.service("deleteApprovalConsumer", ["approvalService", "approvalDataRepository", "datasetRepository", "$q", deleteApprovalConsumer]);
            app.service("uploadPatientOriginConsumer", ["$q", "systemSettingService", "patientOriginRepository", "orgUnitRepository", uploadPatientOriginConsumer]);
            app.service("downloadChartConsumer", ["chartService", "chartRepository", "userPreferenceRepository", "datasetRepository", "$q", downloadChartConsumer]);
            app.service("uploadReferralLocationsConsumer", ["$q", "systemSettingService", "referralLocationsRepository", "orgUnitRepository", uploadReferralLocationsConsumer]);
            app.service("uploadExcludedDataElementsConsumer", ["$q", "systemSettingService", "excludedDataElementsRepository", "orgUnitRepository", uploadExcludedDataElementsConsumer]);
            app.service("downloadPivotTableConsumer", ["pivotTableService", "pivotTableRepository", "userPreferenceRepository", "$q", "datasetRepository", downloadPivotTableConsumer]);
            app.service("dispatcher", ["$q", "$log", "downloadOrgUnitConsumer", "uploadOrgUnitConsumer", "uploadOrgUnitGroupConsumer", "downloadDatasetConsumer", "uploadDatasetConsumer",
                "createUserConsumer", "updateUserConsumer", "downloadDataConsumer", "uploadDataConsumer", "uploadCompletionDataConsumer", "uploadApprovalDataConsumer", "uploadProgramConsumer",
                "downloadProgramConsumer", "downloadEventDataConsumer", "uploadEventDataConsumer", "deleteEventConsumer", "downloadApprovalConsumer", "downloadMetadataConsumer",
                "downloadOrgUnitGroupConsumer", "deleteApprovalConsumer", "downloadSystemSettingConsumer", "uploadPatientOriginConsumer", "downloadChartConsumer",
                "uploadReferralLocationsConsumer", "downloadPivotTableConsumer", "downloadProjectSettingsConsumer", "uploadExcludedDataElementsConsumer", dispatcher
            ]);

        };
        return {
            init: init
        };
    });
