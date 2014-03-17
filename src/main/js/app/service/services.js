define(["metadataSyncService"], function(metadataSyncService) {
    var init = function(app) {
        app.service('metadataSyncService', ['$indexedDB', '$http', metadataSyncService]);
    };
    return {
        init: init
    };
});