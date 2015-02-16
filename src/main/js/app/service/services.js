define(["metadataService", "filesystemService"], function(metadataService, filesystemService) {
    var init = function(app) {
        app.service('metadataService', ['$http', metadataService]);
        app.service('filesystemService', ['$q', filesystemService]);
    };
    return {
        init: init
    };
});
