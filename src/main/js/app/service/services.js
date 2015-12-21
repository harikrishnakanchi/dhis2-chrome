define(["metadataService", "filesystemService", "datasetService", "programService", "systemSettingService", "resourceBundleService"], function(metadataService, filesystemService, datasetService, programService, systemSettingService, resourceBundleService) {
    var init = function(app) {
        app.service('metadataService', ['$http', metadataService]);
        app.service('systemSettingService', ['$http', '$q', systemSettingService]);
        app.service('datasetService', ['$http', datasetService]);
        app.service('programService', ['$http', programService]);
        app.service('filesystemService', ['$q', filesystemService]);
        app.service('resourceBundleService', ['$rootScope', resourceBundleService]);
    };
    return {
        init: init
    };
});
