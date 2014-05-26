define(["dataService", "metadataService", "dataValuesService"], function(dataService, metadataService, dataValuesService) {
    var init = function(app) {
        app.service('dataService', ['$http', '$q', dataService]);
        app.service('metadataService', ['$http', '$indexedDB', metadataService]);
        app.service('dataValuesService', ['dataService', 'dataRepository', 'dataSetRepository', 'userPreferenceRepository', '$q', dataValuesService]);
    };
    return {
        init: init
    };
});