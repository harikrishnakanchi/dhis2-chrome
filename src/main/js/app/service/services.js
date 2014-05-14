define(["metadataService", "dataService", "orgUnitService", "userService"], function(metadataService, dataService, orgUnitService, userService) {
    var init = function(app) {
        app.service('metadataService', ['$indexedDB', '$http', metadataService]);
        app.service('dataService', ['$http', '$indexedDB', '$q', dataService]);
        app.service('orgUnitService', ['$http', '$indexedDB', orgUnitService]);
        app.service('userService', ['$http', '$indexedDB', userService]);
    };
    return {
        init: init
    };
});