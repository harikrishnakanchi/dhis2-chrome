define(["dataValuesConsumer", "consumerRegistry"], function(dataValuesConsumer, consumerRegistry) {
    var init = function(app) {
        app.service("dataValuesConsumer", ["dataService", "dataRepository", "dataSetRepository", "userPreferenceRepository", "$q", "approvalService", dataValuesConsumer]);
        app.service("consumerRegistry", ["$hustle", "$q", "dataValuesConsumer", consumerRegistry]);
    };
    return {
        init: init
    };
});