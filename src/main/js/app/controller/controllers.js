define(['dashboardController', 'dataEntryController', 'mainController', 'projectsController'], function(dashboardController, dataEntryController, mainController, projectsController) {
    var init = function(app) {
        app.controller('dashboardController', ['$scope', dashboardController]);
        app.controller('dataEntryController', ['$scope', '$q', '$indexedDB', 'dataService', '$anchorScroll', '$location', '$modal', dataEntryController]);
        app.controller('projectsController', ['$scope', '$indexedDB', projectsController]);
        app.controller('mainController', ['$rootScope', 'ngI18nResourceBundle', mainController]);
    };
    return {
        init: init
    };
});