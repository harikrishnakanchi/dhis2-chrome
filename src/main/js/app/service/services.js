define(["metadataService", "filesystemService", "dataSetService", "programService", "orgUnitService", "systemSettingService", "historyService"], function(metadataService, filesystemService, dataSetService, programService, orgUnitService, systemSettingService, historyService) {
    var init = function(app) {
        app.service('metadataService', ['$http', metadataService]);
        app.service('systemSettingService', ['$http', '$q', systemSettingService]);
        app.service('dataSetService', ['$http', '$q', dataSetService]);
        app.service('programService', ['$http', programService]);
        app.service('filesystemService', ['$q', filesystemService]);
        app.service('historyService', ['$location', historyService]);
        app.service('orgUnitService', ['$http', orgUnitService]);
    };
    return {
        init: init
    };
});
