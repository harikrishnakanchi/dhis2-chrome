define(["dataRepository", "dataSetRepository", "userPreferenceRepository", "approvalDataRepository", "orgUnitRepository", "programEventRepository"], function(dataRepository, dataSetRepository, userPreferenceRepository, approvalDataRepository, orgUnitRepository, programEventRepository, orgUnitGroupRepository) {
    var init = function(app) {
        app.service('dataRepository', ['$indexedDB', dataRepository]);
        app.service('dataSetRepository', ['$indexedDB', dataSetRepository]);
        app.service('orgUnitRepository', ['$indexedDB', orgUnitRepository]);
        app.service('dataSetRepository', ['$indexedDB', dataSetRepository]);
        app.service('userPreferenceRepository', ['$indexedDB', 'orgUnitRepository', userPreferenceRepository]);
        app.service('approvalDataRepository', ['$indexedDB', approvalDataRepository]);
        app.service('programEventRepository', ['$indexedDB', '$q', programEventRepository]);
        app.service('orgUnitGroupRepository', ['$indexedDB', orgUnitGroupRepository]);
    };
    return {
        init: init
    };
});