define(["metadataService", "filesystemService", "systemSettingService", "chartService"], function(metadataService, filesystemService, systemSettingService, chartService) {
    var init = function(app) {
        app.service('metadataService', ['$http', metadataService]);
        app.service('systemSettingService', ['$http', systemSettingService]);
        app.service('filesystemService', ['$q', filesystemService]);
        app.service('chartService', ['$http', 'chartRepository', chartService]);
    };
    return {
        init: init
    };
});
