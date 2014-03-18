define(['dashboardController', 'dataEntryController'], function(dashboardController, dataEntryController) {
    var init = function(app) {
        app.controller('dashboardController', ['$scope', dashboardController]);
        app.controller('dataEntryController', ['$scope', '$q', '$indexedDB', dataEntryController]);
    };
    return {
        init: init
    };
});