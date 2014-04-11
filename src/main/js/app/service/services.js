define(["metadataService", "dataService"], function(metadataService, dataService) {
    var init = function(app) {
        app.service('metadataService', ['$indexedDB', '$http', metadataService]);
        app.service('dataService', ['$http', dataService]);
    };
    return {
        init: init
    };
});