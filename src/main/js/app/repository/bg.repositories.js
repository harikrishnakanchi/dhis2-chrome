define(["dataRepository", "dataSetRepository", "userPreferenceRepository", "approvalDataRepository", "orgUnitRepository", "programEventRepository"], function(dataRepository, dataSetRepository, userPreferenceRepository, approvalDataRepository, orgUnitRepository, programEventRepository) {
    var init = function(app) {
        app.service('dataRepository', ['$indexedDB', dataRepository]);
        app.service('dataSetRepository', ['$indexedDB', dataSetRepository]);
        app.service('orgUnitRepository', ['$indexedDB', orgUnitRepository]);
        app.service('dataSetRepository', ['$indexedDB', dataSetRepository]);
        app.service('userPreferenceRepository', ['$indexedDB', userPreferenceRepository]);
        app.service('approvalDataRepository', ['$indexedDB', approvalDataRepository]);
        app.service('programEventRepository', ['$indexedDB', '$q', programEventRepository]);
    };
    return {
        init: init
    };
});