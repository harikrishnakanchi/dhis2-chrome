define(['dashboardController', 'dataEntryController', 'mainController', 'projectsController'], function(dashboardController, dataEntryController, mainController, projectsController) {
    var init = function(app) {
        app.controller('dashboardController', ['$scope', dashboardController]);
        app.controller('dataEntryController', ['$scope', '$q', '$indexedDB', dataEntryController]);
        app.controller('mainController', ['$rootScope', 'ngI18nResourceBundle', mainController]);
        app.controller('projectsController', ['$scope', projectsController]);
    };
    return {
        init: init
    };
});