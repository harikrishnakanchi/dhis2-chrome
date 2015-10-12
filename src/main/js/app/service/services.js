define(["metadataService", "filesystemService", "systemSettingService"], function(metadataService, filesystemService, systemSettingService) {
    var init = function(app) {
        app.service('metadataService', ['$http', metadataService]);
        app.service('systemSettingService', ['$http', '$q', systemSettingService]);
        app.service('filesystemService', ['$q', filesystemService]);
    };
    return {
        init: init
    };
});
