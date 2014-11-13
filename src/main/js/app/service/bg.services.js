define(["dataService", "metadataService", "approvalService", "orgUnitService", "datasetService", "systemSettingService", "userService", "programService"],
    function(dataService, metadataService, approvalService, orgUnitService, datasetService, systemSettingService, userService, programService) {
        var init = function(app) {
            app.service('dataService', ['$http', '$q', dataService]);
            app.service('approvalService', ['$http', '$indexedDB', '$q', approvalService]);
            app.service('metadataService', ['$http', '$indexedDB', '$q', metadataService]);
            app.service('orgUnitService', ['$http', '$indexedDB', orgUnitService]);
            app.service('datasetService', ['$http', datasetService]);
            app.service('userService', ['$http', '$indexedDB', userService]);
            app.service('systemSettingService', ['$http', systemSettingService]);
            app.service('programService', ['$http', programService]);
        };
        return {
            init: init
        };
    });