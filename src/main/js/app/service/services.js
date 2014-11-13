define(["metadataService", "dataService", "orgUnitService", "userService", "approvalService", "datasetService", "systemSettingService"],
    function(metadataService, dataService, orgUnitService, userService, approvalService, datasetService, systemSettingService) {
        var init = function(app) {
            app.service('metadataService', ['$http', '$indexedDB', '$q', metadataService]);
            app.service('dataService', ['$http', '$q', dataService]);
            app.service('orgUnitService', ['$http', '$indexedDB', orgUnitService]);
            app.service('datasetService', ['$http', datasetService]);
            app.service('systemSettingService', ['$http', systemSettingService]);
            app.service('userService', ['$http', '$indexedDB', userService]);
            app.service('approvalService', ['$http', '$indexedDB', '$q', approvalService]);
            app.service('programService', ['$http', programService]);
        };
        return {
            init: init
        };
    });