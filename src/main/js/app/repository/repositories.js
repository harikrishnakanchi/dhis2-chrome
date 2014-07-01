define(["dataRepository", "dataSetRepository", "userPreferenceRepository", "orgUnitRepository", "systemSettingRepository", "userRepository"],
    function(dataRepository, dataSetRepository, userPreferenceRepository, orgUnitRepository, systemSettingRepository, userRepository) {
        var init = function(app) {
            app.service('dataRepository', ['$indexedDB', dataRepository]);
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