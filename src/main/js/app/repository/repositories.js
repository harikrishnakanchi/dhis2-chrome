define(["dataRepository", "dataSetRepository", "userPreferenceRepository", "orgUnitRepository"], function(dataRepository, dataSetRepository, userPreferenceRepository, orgUnitRepository) {
    var init = function(app) {
        app.service('dataRepository', ['$indexedDB', dataRepository]);
        app.service('dataSetRepository', ['$indexedDB', dataSetRepository]);
        app.service('userPreferenceRepository', ['$indexedDB', userPreferenceRepository]);
        app.service('orgUnitRepository', ['$indexedDB', orgUnitRepository]);
    };
    return {
        init: init
    };
});