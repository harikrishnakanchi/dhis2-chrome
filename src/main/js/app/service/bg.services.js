define(["dataService"], function(dataService) {
    var init = function(app) {
        app.service('dataService', ['$http', '$indexedDB', '$q', dataService]);
    };
    return {
        init: init
    };
});