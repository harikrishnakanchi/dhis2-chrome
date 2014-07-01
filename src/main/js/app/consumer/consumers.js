define(["dataValuesConsumer", "orgUnitConsumer", "datasetConsumer", "systemSettingConsumer", "createUserConsumer", "updateUserConsumer",
        "dispatcher", "consumerRegistry"
    ],
    function(dataValuesConsumer, orgUnitConsumer, datasetConsumer, systemSettingConsumer, createUserConsumer, updateUserConsumer, dispatcher, consumerRegistry) {
        var init = function(app) {
            app.service("dataValuesConsumer", ["dataService", "dataRepository", "dataSetRepository", "userPreferenceRepository", "$q", "approvalService", dataValuesConsumer]);
            app.service("orgUnitConsumer", ["orgUnitService", orgUnitConsumer]);
            app.service("datasetConsumer", ["datasetService", datasetConsumer]);
            app.service("systemSettingConsumer", ["systemSettingService", systemSettingConsumer]);
            app.service("createUserConsumer", ["userService", createUserConsumer]);
            app.service("updateUserConsumer", ["userService", updateUserConsumer]);
            app.service("dispatcher", ["$q", "dataValuesConsumer", "orgUnitConsumer", "datasetConsumer", "systemSettingConsumer", "createUserConsumer", "updateUserConsumer", dispatcher]);
            app.service("consumerRegistry", ["$hustle", "$q", "dispatcher", consumerRegistry]);
        };
        return {
            init: init
        };
    });