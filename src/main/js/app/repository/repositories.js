define(["dataRepository"], function(dataRepository) {
    var init = function(app) {
        app.service('dataRepository', ['$indexedDB', dataRepository]);
    };
    return {
        init: init
    };
});