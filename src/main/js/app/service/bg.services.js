define(["dataService", "metadataService", "approvalService", "orgUnitService", "datasetService"], function(dataService, metadataService, approvalService, orgUnitService, datasetService) {
    var init = function(app) {
        app.service('dataService', ['$http', '$q', dataService]);
        app.service('approvalService', ['$http', '$indexedDB', '$q', approvalService]);
        app.service('metadataService', ['$http', '$indexedDB', metadataService]);
        app.service('orgUnitService', ['$http', '$indexedDB', orgUnitService]);
        app.service('datasetService', ['$http', datasetService]);
    };
    return {
        init: init
    };
});