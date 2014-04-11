define(["dataService"], function(dataService) {
    var init = function(app) {
        app.service('metadataService', ['$indexedDB', '$http', metadataService]);
        app.service('dataService', ['$indexedDB', '$http', dataService]);
    };
    return {
        init: init
    };
});