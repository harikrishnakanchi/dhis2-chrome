define(["dataRepository", "dataSetRepository", "userPreferenceRepository"], function(dataRepository, dataSetRepository, userPreferenceRepository) {
    var init = function(app) {
        app.service('dataRepository', ['$indexedDB', dataRepository]);
        app.service('dataSetRepository', ['$indexedDB', dataSetRepository]);
        app.service('userPreferenceRepository', ['$indexedDB', userPreferenceRepository]);
    };
    return {
        init: init
    };
});