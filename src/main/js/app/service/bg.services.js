define(["dataService", "metadataService"], function(dataService, metadataService) {
    var init = function(app) {
        app.service('dataService', ['$http', '$indexedDB', '$q', dataService]);
        app.service('metadataService', ['$http', '$indexedDB', metadataService]);
    };
    return {
        init: init
    };
});