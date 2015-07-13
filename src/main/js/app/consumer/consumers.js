define(["uploadApprovalDataConsumer", "downloadOrgUnitConsumer", "uploadOrgUnitConsumer", "uploadOrgUnitGroupConsumer", "downloadDatasetConsumer", "uploadDatasetConsumer",
        "createUserConsumer", "updateUserConsumer", "dispatcher", "consumerRegistry", "downloadDataConsumer", "uploadDataConsumer", "uploadCompletionDataConsumer",
        "orgUnitRepository", "programRepository", "uploadProgramConsumer", "downloadProgramConsumer", "downloadEventDataConsumer", "deleteEventConsumer", "eventService", "programEventRepository", "uploadEventDataConsumer",
        "downloadApprovalConsumer", "downloadMetadataConsumer", "downloadOrgUnitGroupConsumer", "deleteApprovalConsumer", "downloadSystemSettingConsumer", "uploadSystemSettingConsumer", "metadataService", "metadataRepository",
        "downloadPatientOriginConsumer", "uploadPatientOriginConsumer", "mergeBy", "downloadChartConsumer"
    ],
    function(uploadApprovalDataConsumer, downloadOrgUnitConsumer, uploadOrgUnitConsumer, uploadOrgUnitGroupConsumer, downloadDatasetConsumer, uploadDatasetConsumer,
        createUserConsumer, updateUserConsumer, dispatcher, consumerRegistry, downloadDataConsumer, uploadDataConsumer, uploadCompletionDataConsumer,
        orgUnitRepository, programRepository, uploadProgramConsumer, downloadProgramConsumer, downloadEventDataConsumer, deleteEventConsumer, eventService, programEventRepository, uploadEventDataConsumer,
        downloadApprovalConsumer, downloadMetadataConsumer, downloadOrgUnitGroupConsumer, deleteApprovalConsumer, downloadSystemSettingConsumer, uploadSystemSettingConsumer, metadataService, metadataRepository,
        downloadPatientOriginConsumer, uploadPatientOriginConsumer, mergeBy, downloadChartConsumer) {

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
            app.service("uploadSystemSettingConsumer", ["systemSettingService", "systemSettingRepository", "$q", uploadSystemSettingConsumer]);
            app.service("consumerRegistry", ["$hustle", "$q", "$log", "dispatcher", consumerRegistry]);
            app.service("uploadProgramConsumer", ["programService", "programRepository", "$q", uploadProgramConsumer]);
            app.service("downloadProgramConsumer", ["programService", "programRepository", "changeLogRepository", "$q", "mergeBy", downloadProgramConsumer]);
            app.service("downloadEventDataConsumer", ["eventService", "programEventRepository", "userPreferenceRepository", "$q", downloadEventDataConsumer]);
            app.service("uploadEventDataConsumer", ["eventService", "programEventRepository", "userPreferenceRepository", "$q", uploadEventDataConsumer]);
            app.service("deleteEventConsumer", ["eventService", "programEventRepository", "$q", deleteEventConsumer]);
            app.service("downloadMetadataConsumer", ["metadataService", "metadataRepository", "changeLogRepository", downloadMetadataConsumer]);
            app.service("deleteApprovalConsumer", ["approvalService", "approvalDataRepository", "datasetRepository", "$q", deleteApprovalConsumer]);
            app.service("downloadPatientOriginConsumer", ["patientOriginService", "patientOriginRepository", "mergeBy", downloadPatientOriginConsumer]);
            app.service("uploadPatientOriginConsumer", ["patientOriginService", "patientOriginRepository", uploadPatientOriginConsumer]);
            app.service("downloadChartConsumer", ["chartService", "chartRepository", "orgUnitRepository", "$q", downloadChartConsumer]);
            app.service("dispatcher", ["$q", "$log", "downloadOrgUnitConsumer", "uploadOrgUnitConsumer", "uploadOrgUnitGroupConsumer", "downloadDatasetConsumer", "uploadDatasetConsumer", "createUserConsumer", "updateUserConsumer",
                "downloadDataConsumer", "uploadDataConsumer", "uploadCompletionDataConsumer", "uploadApprovalDataConsumer", "uploadProgramConsumer", "downloadProgramConsumer", "downloadEventDataConsumer",
                "uploadEventDataConsumer", "deleteEventConsumer", "downloadApprovalConsumer", "downloadMetadataConsumer", "downloadOrgUnitGroupConsumer", "deleteApprovalConsumer",
                "downloadSystemSettingConsumer", "uploadSystemSettingConsumer", "downloadPatientOriginConsumer", "uploadPatientOriginConsumer", "downloadChartConsumer", dispatcher
            ]);

        };
        return {
            init: init
        };
    });
