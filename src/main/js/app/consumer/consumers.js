define(["dataValuesConsumer", "orgUnitConsumer", "datasetConsumer", "dispatcher", "consumerRegistry"], function(dataValuesConsumer, orgUnitConsumer, datasetConsumer, dispatcher, consumerRegistry) {
    var init = function(app) {
        app.service("dataValuesConsumer", ["dataService", "dataRepository", "dataSetRepository", "userPreferenceRepository", "$q", "approvalService", dataValuesConsumer]);
        app.service("orgUnitConsumer", ["orgUnitService", orgUnitConsumer]);
        app.service("datasetConsumer", ["datasetService", datasetConsumer]);
        app.service("dispatcher", ["$q", "dataValuesConsumer", "orgUnitConsumer", "datasetConsumer", dispatcher]);
        app.service("consumerRegistry", ["$hustle", "$q", "dispatcher", consumerRegistry]);
    };
    return {
        init: init
    };
});