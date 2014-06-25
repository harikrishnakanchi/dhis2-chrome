define(["dataService", "metadataService", "approvalService", "orgUnitService"], function(dataService, metadataService, approvalService, orgUnitService) {
    var init = function(app) {
        app.service('dataService', ['$http', '$q', dataService]);
        app.service('approvalService', ['$http', '$indexedDB', '$q', approvalService]);
        app.service('metadataService', ['$http', '$indexedDB', metadataService]);
        app.service('orgUnitService', ['$http', '$indexedDB', orgUnitService]);
    };
    return {
        init: init
    };
});