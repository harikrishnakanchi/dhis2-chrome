define(["dataService", "metadataService"], function(dataService, metadataService) {
    var init = function(app) {
        app.service('dataService', ['$http', '$q', dataService]);
        app.service('metadataService', ['$http', '$indexedDB', metadataService]);
    };
    return {
        init: init
    };
});