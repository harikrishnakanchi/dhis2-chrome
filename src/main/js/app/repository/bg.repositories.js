define(["dataRepository", "dataSetRepository", "userPreferenceRepository", "approvalDataRepository", "orgUnitRepository"], function(dataRepository, dataSetRepository, userPreferenceRepository, approvalDataRepository, orgUnitRepository) {
    var init = function(app) {
        app.service('dataRepository', ['$indexedDB', dataRepository]);
        app.service('dataSetRepository', ['$indexedDB', dataSetRepository]);
        app.service('orgUnitRepository', ['$indexedDB', orgUnitRepository]);
        app.service('dataSetRepository', ['$indexedDB', dataSetRepository]);
        app.service('userPreferenceRepository', ['$indexedDB', userPreferenceRepository]);
        app.service('approvalDataRepository', ['$indexedDB', approvalDataRepository]);
    };
    return {
        init: init
    };
});