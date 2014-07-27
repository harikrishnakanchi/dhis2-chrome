define(["uploadApprovalDataConsumer", "orgUnitConsumer", "datasetConsumer", "systemSettingConsumer", "createUserConsumer", "updateUserConsumer",
        "dispatcher", "consumerRegistry", "downloadDataConsumer", "uploadDataConsumer", "uploadCompletionDataConsumer", "orgUnitRepository"
    ],
    function(uploadApprovalDataConsumer, orgUnitConsumer, datasetConsumer, systemSettingConsumer, createUserConsumer, updateUserConsumer, dispatcher, consumerRegistry, downloadDataConsumer, uploadDataConsumer, uploadCompletionDataConsumer, orgUnitRepository) {
        var init = function(app) {
            app.service("downloadDataConsumer", ["dataService", "dataRepository", "dataSetRepository", "userPreferenceRepository", "$q", "approvalService", "approvalDataRepository", "orgUnitRepository", downloadDataConsumer]);
            app.service("uploadDataConsumer", ["dataService", "dataRepository", uploadDataConsumer]);
            app.service("uploadCompletionDataConsumer", ["approvalService", "approvalDataRepository", uploadCompletionDataConsumer]);
            app.service("uploadApprovalDataConsumer", ["approvalService", "approvalDataRepository", uploadApprovalDataConsumer]);
            app.service("orgUnitConsumer", ["orgUnitService", orgUnitConsumer]);
            app.service("datasetConsumer", ["datasetService", datasetConsumer]);
            app.service("systemSettingConsumer", ["systemSettingService", systemSettingConsumer]);
            app.service("createUserConsumer", ["userService", createUserConsumer]);
            app.service("updateUserConsumer", ["userService", updateUserConsumer]);
            app.service("dispatcher", ["$q", "orgUnitConsumer", "datasetConsumer", "systemSettingConsumer", "createUserConsumer", "updateUserConsumer", "downloadDataConsumer", "uploadDataConsumer", "uploadCompletionDataConsumer", "uploadApprovalDataConsumer", dispatcher]);
            app.service("consumerRegistry", ["$hustle", "$q", "dispatcher", consumerRegistry]);
        };
        return {
            init: init
        };
    });