define(["dataRepository", "dataSetRepository"], function(dataRepository, dataSetRepository) {
    var init = function(app) {
        app.service('dataRepository', ['$indexedDB', dataRepository]);
        app.service('dataSetRepository', ['$indexedDB', dataSetRepository]);
    };
    return {
        init: init
    };
});