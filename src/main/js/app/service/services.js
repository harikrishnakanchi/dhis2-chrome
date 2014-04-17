define(["metadataService", "dataService", "projectsService"], function(metadataService, dataService, projectsService) {
    var init = function(app) {
        app.service('metadataService', ['$indexedDB', '$http', metadataService]);
        app.service('dataService', ['$http', '$indexedDB', dataService]);
        app.service('projectsService', ['$http', projectsService]);
    };
    return {
        init: init
    };
});