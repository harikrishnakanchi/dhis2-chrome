define(["dataService", "metadataService", "approvalService", "orgUnitService", "datasetService", "systemSettingService"], function(dataService, metadataService, approvalService, orgUnitService, datasetService, systemSettingService) {
    var init = function(app) {
        app.service('dataService', ['$http', '$q', dataService]);
        app.service('approvalService', ['$http', '$indexedDB', '$q', approvalService]);
        app.service('metadataService', ['$http', '$indexedDB', metadataService]);
        app.service('orgUnitService', ['$http', '$indexedDB', orgUnitService]);
        app.service('datasetService', ['$http', datasetService]);
        app.service('systemSettingService', ['$http', systemSettingService]);
    };
    return {
        init: init
    };
});