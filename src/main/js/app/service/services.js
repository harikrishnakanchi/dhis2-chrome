define(["metadataService", "filesystemService", "dataSetService", "programService", "orgUnitService", "systemSettingService", "historyService", "storageService", "metadataDownloader", "systemInfoService"],
    function(metadataService, filesystemService, dataSetService, programService, orgUnitService, systemSettingService, historyService, storageService, metadataDownloader, systemInfoService) {
    var init = function(app) {
        app.service('metadataService', ['$http', metadataService]);
        app.service('systemSettingService', ['$http', '$q', systemSettingService]);
        app.service('dataSetService', ['$http', '$q', dataSetService]);
        app.service('programService', ['$http', programService]);
        app.service('filesystemService', ['$rootScope', '$q', '$modal', filesystemService]);
        app.service('historyService', ['$location', historyService]);
        app.service('orgUnitService', ['$http', orgUnitService]);
        app.service('storageService', ['$window', storageService]);
        app.service('systemInfoService', ['$http', systemInfoService]);
        app.service('metadataDownloader', ['$http', '$q', 'changeLogRepository', 'metadataRepository', 'orgUnitGroupRepository', 'dataSetRepository', 'programRepository', 'systemSettingRepository', 'orgUnitRepository', 'userRepository', metadataDownloader]);
    };
    return {
        init: init
    };
});
