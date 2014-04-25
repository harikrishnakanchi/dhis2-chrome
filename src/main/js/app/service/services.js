define(["metadataService", "dataService", "orgUnitService"], function(metadataService, dataService, orgUnitService) {
    var init = function(app) {
        app.service('metadataService', ['$indexedDB', '$http', metadataService]);
        app.service('dataService', ['$http', '$indexedDB', dataService]);
        app.service('orgUnitService', ['$http', '$indexedDB', orgUnitService]);
    };
    return {
        init: init
    };
});