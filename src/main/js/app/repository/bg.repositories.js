define(["dataRepository", "dataSetRepository", "userPreferenceRepository", "approvalDataRepository", "orgUnitRepository",
    "programEventRepository", "orgUnitGroupRepository", "changeLogRepository", "programRepository"
], function(dataRepository, dataSetRepository, userPreferenceRepository, approvalDataRepository, orgUnitRepository,
    programEventRepository, orgUnitGroupRepository, changeLogRepository, programRepository) {
    var init = function(app) {
        app.service('dataRepository', ['$indexedDB', dataRepository]);
        app.service('dataSetRepository', ['$indexedDB', dataSetRepository]);
        app.service('orgUnitRepository', ['$indexedDB', 'dataSetRepository', '$q', orgUnitRepository]);
        app.service('userPreferenceRepository', ['$indexedDB', 'orgUnitRepository', userPreferenceRepository]);
        app.service('approvalDataRepository', ['$indexedDB', approvalDataRepository]);
        app.service('programEventRepository', ['$indexedDB', '$q', programEventRepository]);
        app.service('orgUnitGroupRepository', ['$indexedDB', orgUnitGroupRepository]);
        app.service('changeLogRepository', ['$indexedDB', changeLogRepository]);
        app.service('programRepository', ['$indexedDB', "$q", programRepository]);
    };
    return {
        init: init
    };
});
