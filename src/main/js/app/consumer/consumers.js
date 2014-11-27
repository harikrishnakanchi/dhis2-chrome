define(["uploadApprovalDataConsumer", "orgUnitConsumer", "orgUnitGroupConsumer", "datasetConsumer", "systemSettingConsumer", "createUserConsumer", "updateUserConsumer",
        "dispatcher", "consumerRegistry", "downloadDataConsumer", "uploadDataConsumer", "uploadCompletionDataConsumer", "orgUnitRepository", "programConsumer",
        "downloadEventDataConsumer","deleteEventConsumer", "eventService", "programEventRepository", "uploadEventDataConsumer"
    ],
    function(uploadApprovalDataConsumer, orgUnitConsumer,orgUnitGroupConsumer, datasetConsumer, systemSettingConsumer, createUserConsumer, updateUserConsumer,
        dispatcher, consumerRegistry, downloadDataConsumer, uploadDataConsumer, uploadCompletionDataConsumer, orgUnitRepository, programConsumer, 
        downloadEventDataConsumer, deleteEventConsumer, eventService, programEventRepository, uploadEventDataConsumer) {

        var init = function(app) {
            app.service("downloadDataConsumer", ["dataService", "dataRepository", "dataSetRepository", "userPreferenceRepository", "$q", "approvalService", "approvalDataRepository", "orgUnitRepository", downloadDataConsumer]);
            app.service("uploadDataConsumer", ["dataService", "dataRepository", uploadDataConsumer]);
            app.service("uploadCompletionDataConsumer", ["approvalService", "approvalDataRepository", uploadCompletionDataConsumer]);
            app.service("uploadApprovalDataConsumer", ["approvalService", "approvalDataRepository", uploadApprovalDataConsumer]);
            app.service("orgUnitConsumer", ["orgUnitService", orgUnitConsumer]);
            app.service("orgUnitGroupConsumer", ["orgUnitGroupService", orgUnitGroupConsumer]);
            app.service("datasetConsumer", ["datasetService", datasetConsumer]);
            app.service("systemSettingConsumer", ["systemSettingService", systemSettingConsumer]);
            app.service("createUserConsumer", ["userService", createUserConsumer]);
            app.service("updateUserConsumer", ["userService", updateUserConsumer]);
            app.service("dispatcher", ["$q", "orgUnitConsumer", "orgUnitGroupConsumer","datasetConsumer", "systemSettingConsumer", "createUserConsumer", "updateUserConsumer", "downloadDataConsumer", "uploadDataConsumer", "uploadCompletionDataConsumer", "uploadApprovalDataConsumer", "programConsumer", "downloadEventDataConsumer", "uploadEventDataConsumer", "deleteEventConsumer", dispatcher]);
            app.service("consumerRegistry", ["$hustle", "$q", "dispatcher", consumerRegistry]);
            app.service("programConsumer", ["programService", programConsumer]);
            app.service("downloadEventDataConsumer", ["eventService", "programEventRepository", "$q", downloadEventDataConsumer]);
            app.service("uploadEventDataConsumer", ["eventService", "programEventRepository", "$q", uploadEventDataConsumer]);
            app.service("deleteEventConsumer", ["eventService", "$q", deleteEventConsumer]);
        };
        return {
            init: init
        };
    });