define(["dataRepository", "dataSetRepository", "userPreferenceRepository", "orgUnitRepository","systemSettingRepository"], function(dataRepository, dataSetRepository, userPreferenceRepository, orgUnitRepository,systemSettingRepository) {
    var init = function(app) {
        app.service('dataRepository', ['$indexedDB', dataRepository]);
        app.service('dataSetRepository', ['$indexedDB', dataSetRepository]);
        app.service('systemSettingRepository', ['$indexedDB', systemSettingRepository]);
        app.service('userPreferenceRepository', ['$indexedDB', userPreferenceRepository]);
        app.service('orgUnitRepository', ['$indexedDB', orgUnitRepository]);
    };
    return {
        init: init
    };
});
