define(["dataService", "metadataService", "approvalService", "orgUnitService", "dataSetService", "systemSettingService", "userService", "programService", "eventService", "orgUnitGroupService", 'reportService', 'dataStoreService'],
    function(dataService, metadataService, approvalService, orgUnitService, dataSetService, systemSettingService, userService, programService, eventService, orgUnitGroupService, reportService, dataStoreService) {
        var init = function(app) {
            app.service('dataService', ['$http', '$q', dataService]);
            app.service('approvalService', ['$http', '$indexedDB', '$q', approvalService]);
            app.service('metadataService', ['$http', metadataService]);
            app.service('orgUnitService', ['$http', '$indexedDB', orgUnitService]);
            app.service('orgUnitGroupService', ['$http', '$q', orgUnitGroupService]);
            app.service('dataSetService', ['$http', dataSetService]);
            app.service('userService', ['$http', '$indexedDB', userService]);
            app.service('systemSettingService', ['$http', systemSettingService]);
            app.service('programService', ['$http', programService]);
            app.service('eventService', ['$http', '$q', eventService]);
            app.service('reportService', ['$http', '$q', reportService]);
            app.service('dataStoreService', ['$http', '$q', dataStoreService]);
        };
        return {
            init: init
        };
    });
