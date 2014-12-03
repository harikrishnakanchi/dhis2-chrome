define(["metadataService", "dataService", "orgUnitService", "userService", "approvalService", "datasetService", "systemSettingService", "programService",
        "eventService", "orgUnitGroupService", "filesystemService"
    ],
    function(metadataService, dataService, orgUnitService, userService, approvalService, datasetService, systemSettingService, programService,
        eventService, orgUnitGroupService, filesystemService) {
        var init = function(app) {
            app.service('metadataService', ['$http', '$indexedDB', '$q', metadataService]);
            app.service('dataService', ['$http', '$q', dataService]);
            app.service('orgUnitService', ['$http', '$indexedDB', orgUnitService]);
            app.service('orgUnitGroupService', ['$http', '$indexedDB', orgUnitGroupService]);
            app.service('datasetService', ['$http', datasetService]);
            app.service('systemSettingService', ['$http', systemSettingService]);
            app.service('userService', ['$http', '$indexedDB', userService]);
            app.service('approvalService', ['$http', '$indexedDB', '$q', approvalService]);
            app.service('programService', ['$http', programService]);
            app.service('eventService', ['$http', '$q', eventService]);
            app.service('filesystemService', [filesystemService]);
        };
        return {
            init: init
        };
    });
