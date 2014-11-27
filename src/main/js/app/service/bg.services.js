define(["dataService", "metadataService", "approvalService", "orgUnitService", "datasetService", "systemSettingService", "userService", "programService", "eventService", "orgUnitGroupService"],
    function(dataService, metadataService, approvalService, orgUnitService, datasetService, systemSettingService, userService, programService, eventService, orgUnitGroupService) {
        var init = function(app) {
            app.service('dataService', ['$http', '$q', dataService]);
            app.service('approvalService', ['$http', '$indexedDB', '$q', approvalService]);
            app.service('metadataService', ['$http', '$indexedDB', '$q', metadataService]);
            app.service('orgUnitService', ['$http', '$indexedDB', orgUnitService]);
            app.service('orgUnitGroupService', ['$http', '$indexedDB', orgUnitGroupService]);
            app.service('datasetService', ['$http', datasetService]);
            app.service('userService', ['$http', '$indexedDB', userService]);
            app.service('systemSettingService', ['$http', systemSettingService]);
            app.service('programService', ['$http', programService]);
            app.service('eventService', ['$http', '$q', eventService]);
        };
        return {
            init: init
        };
    });