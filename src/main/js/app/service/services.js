define(["metadataService", "dataService", "orgUnitService", "userService", "approvalService", "datasetService"],
    function(metadataService, dataService, orgUnitService, userService, approvalService, datasetService) {
        var init = function(app) {
            app.service('metadataService', ['$http', '$indexedDB', metadataService]);
            app.service('dataService', ['$http', '$q', dataService]);
            app.service('orgUnitService', ['$http', '$indexedDB', orgUnitService]);
            app.service('datasetService', ['$http', datasetService]);
            app.service('userService', ['$http', '$indexedDB', userService]);
            app.service('approvalService', ['$http', '$indexedDB', '$q', approvalService]);
        };
        return {
            init: init
        };
    });