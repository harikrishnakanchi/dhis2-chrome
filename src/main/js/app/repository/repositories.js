define(["dataRepository", "dataSetRepository", "userPreferenceRepository", "orgUnitRepository", "systemSettingRepository", "userRepository", "approvalDataRepository"],
    function(dataRepository, dataSetRepository, userPreferenceRepository, orgUnitRepository, systemSettingRepository, userRepository, approvalDataRepository) {
        var init = function(app) {
            app.service('dataRepository', ['$indexedDB', dataRepository]);
            app.service('approvalDataRepository', ['$indexedDB', approvalDataRepository]);
            app.service('dataSetRepository', ['$indexedDB', dataSetRepository]);
            app.service('systemSettingRepository', ['$indexedDB', systemSettingRepository]);
            app.service('userPreferenceRepository', ['$indexedDB', userPreferenceRepository]);
            app.service('orgUnitRepository', ['$indexedDB', orgUnitRepository]);
            app.service('userRepository', ['$indexedDB', userRepository]);
        };
        return {
            init: init
        };
    });