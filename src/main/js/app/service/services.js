define(["metadataService", "filesystemService", "dataSetService", "programService", "systemSettingService", "historyService"], function(metadataService, filesystemService, dataSetService, programService, systemSettingService, historyService) {
    var init = function(app) {
        app.service('metadataService', ['$http', metadataService]);
        app.service('systemSettingService', ['$http', '$q', systemSettingService]);
        app.service('dataSetService', ['$http', '$q', dataSetService]);
        app.service('programService', ['$http', programService]);
        app.service('filesystemService', ['$q', filesystemService]);
        app.service('historyService', ['$location', historyService]);
    };
    return {
        init: init
    };
});
