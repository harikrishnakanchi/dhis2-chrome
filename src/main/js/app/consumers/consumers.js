define(["dataValuesConsumer", "registerConsumers"], function(dataValuesConsumer, registerConsumers) {
    var init = function(app) {
        app.service("dataValuesConsumer", ["dataService", dataValuesConsumer]);
        app.service("registerConsumers", ["$hustle", "dataValuesConsumer", registerConsumers]);
    };
    return {
        init: init
    };
});