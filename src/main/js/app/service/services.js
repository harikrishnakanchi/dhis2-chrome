define(["metadataService", "filesystemService", "datasetService", "programService", "systemSettingService"], function(metadataService, filesystemService, datasetService, programService, systemSettingService) {
    var init = function(app) {
        app.service('metadataService', ['$http', metadataService]);
        app.service('systemSettingService', ['$http', '$q', systemSettingService]);
        app.service('datasetService', ['$http', datasetService]);
        app.service('programService', ['$http', programService]);
        app.service('filesystemService', ['$q', filesystemService]);
    };
    return {
        init: init
    };
});
