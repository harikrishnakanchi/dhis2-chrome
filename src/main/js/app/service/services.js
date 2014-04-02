define(["metadataService"], function(metadataService) {
    var init = function(app) {
        app.service('metadataService', ['$indexedDB', '$http', metadataService]);
    };
    return {
        init: init
    };
});