define(['dashboardController', 'dataEntryController', 'mainController'], function(dashboardController, dataEntryController, mainController) {
    var init = function(app) {
        app.controller('dashboardController', ['$scope', dashboardController]);
        app.controller('dataEntryController', ['$scope', '$q', '$indexedDB', dataEntryController]);
        app.controller('mainController', ['$rootScope', 'ngI18nResourceBundle', mainController]);
    };
    return {
        init: init
    };
});