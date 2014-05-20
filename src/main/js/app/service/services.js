define(["metadataService", "dataService", "orgUnitService", "userService", "approvalService"], function(metadataService, dataService, orgUnitService, userService, approvalService) {
    var init = function(app) {
        app.service('metadataService', ['$indexedDB', '$http', metadataService]);
        app.service('dataService', ['$http', '$indexedDB', '$q', dataService]);
        app.service('orgUnitService', ['$http', '$indexedDB', orgUnitService]);
        app.service('userService', ['$http', '$indexedDB', userService]);
        app.service('userService', ['$http', '$indexedDB', userService]);
        app.service('approvalService', ['$http', '$indexedDB', approvalService]);
    };
    return {
        init: init
    };
});