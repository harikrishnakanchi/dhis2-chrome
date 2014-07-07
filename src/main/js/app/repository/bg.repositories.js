define(["dataRepository", "dataSetRepository", "userPreferenceRepository", "approvalDataRepository"], function(dataRepository, dataSetRepository, userPreferenceRepository, approvalDataRepository) {
    var init = function(app) {
        app.service('dataRepository', ['$indexedDB', dataRepository]);
        app.service('dataSetRepository', ['$indexedDB', dataSetRepository]);
        app.service('userPreferenceRepository', ['$indexedDB', userPreferenceRepository]);
        app.service('approvalDataRepository', ['$indexedDB', approvalDataRepository]);
    };
    return {
        init: init
    };
});