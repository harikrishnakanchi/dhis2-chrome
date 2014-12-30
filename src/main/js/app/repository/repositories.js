define(["dataRepository", "dataSetRepository", "userPreferenceRepository", "orgUnitRepository", "systemSettingRepository", "userRepository", "approvalDataRepository", "programRepository", "programEventRepository", "dataElementRepository", "orgUnitGroupRepository", "changeLogRepository"],
    function(dataRepository, dataSetRepository, userPreferenceRepository, orgUnitRepository, systemSettingRepository, userRepository, approvalDataRepository, programRepository, programEventRepository, dataElementRepository, orgUnitGroupRepository, changeLogRepository) {
        var init = function(app) {
            app.service('dataRepository', ['$indexedDB', dataRepository]);
            app.service('approvalDataRepository', ['$indexedDB', approvalDataRepository]);
            app.service('dataSetRepository', ['$indexedDB', dataSetRepository]);
            app.service('systemSettingRepository', ['$indexedDB', systemSettingRepository]);
            app.service('orgUnitRepository', ['$indexedDB', orgUnitRepository]);
            app.service('userPreferenceRepository', ['$indexedDB', "orgUnitRepository", userPreferenceRepository]);
            app.service('userRepository', ['$indexedDB', userRepository]);
            app.service('programRepository', ['$indexedDB', '$q', programRepository]);
            app.service('programEventRepository', ['$indexedDB', '$q', programEventRepository]);
            app.service('dataElementRepository', ['$indexedDB', dataElementRepository]);
            app.service('orgUnitGroupRepository', ['$indexedDB', orgUnitGroupRepository]);
            app.service('changeLogRepository', ['$indexedDB', changeLogRepository]);
        };
        return {
            init: init
        };
    });
