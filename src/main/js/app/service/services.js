define(["metadataSyncService"], function(metadataSyncService) {
    var init = function(app) {
        app.service('metadataSyncService', ['$indexedDB', metadataSyncService]);
    };
    return {
        init: init
    };
});