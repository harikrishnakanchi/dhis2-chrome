define(["metadataService", "filesystemService", "systemSettingService", "resourceBundleService"], function(metadataService, filesystemService, systemSettingService, resourceBundleService) {
    var init = function(app) {
        app.service('metadataService', ['$http', metadataService]);
        app.service('systemSettingService', ['$http', '$q', systemSettingService]);
        app.service('filesystemService', ['$q', filesystemService]);
        app.service('resourceBundleService', ['$rootScope', resourceBundleService]);
    };
    return {
        init: init
    };
});