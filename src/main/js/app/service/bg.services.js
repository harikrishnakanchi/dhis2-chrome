define(["dataService", "metadataService", "approvalService"], function(dataService, metadataService, approvalService) {
    var init = function(app) {
        app.service('dataService', ['$http', '$q', dataService]);
        app.service('approvalService', ['$http', '$indexedDB', '$q', approvalService]);
        app.service('metadataService', ['$http', '$indexedDB', metadataService]);
    };
    return {
        init: init
    };
});