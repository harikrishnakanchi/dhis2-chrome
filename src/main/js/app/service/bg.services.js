define(["dataService", "metadataService", "approvalService", "orgUnitService", "datasetService", "systemSettingService", "userService", "programService", "eventService", "orgUnitGroupService", 'patientOriginService', 'chartService', 'pivotTableService'],
    function(dataService, metadataService, approvalService, orgUnitService, datasetService, systemSettingService, userService, programService, eventService, orgUnitGroupService, patientOriginService, chartService, pivotTableService) {
        var init = function(app) {
            app.service('dataService', ['$http', '$q', dataService]);
            app.service('approvalService', ['$http', '$indexedDB', '$q', approvalService]);
            app.service('metadataService', ['$http', metadataService]);
            app.service('orgUnitService', ['$http', '$indexedDB', orgUnitService]);
            app.service('orgUnitGroupService', ['$http', '$indexedDB', orgUnitGroupService]);
            app.service('datasetService', ['$http', datasetService]);
            app.service('userService', ['$http', '$indexedDB', userService]);
            app.service('systemSettingService', ['$http', systemSettingService]);
            app.service('programService', ['$http', programService]);
            app.service('eventService', ['$http', '$q', eventService]);
            app.service('patientOriginService', ['$http', patientOriginService]);
            app.service('chartService', ['$http', chartService]);
            app.service('pivotTableService', ['$http', pivotTableService]);
        };
        return {
            init: init
        };
    });