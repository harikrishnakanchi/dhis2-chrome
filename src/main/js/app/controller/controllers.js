define(['dashboardController', 'dataEntryController', 'mainController', 'orgUnitContoller', 'projectController'], function(dashboardController, dataEntryController, mainController, orgUnitContoller, projectController) {
    var init = function(app) {
        app.controller('dashboardController', ['$scope', '$q', 'dataService', dashboardController]);
        app.controller('dataEntryController', ['$scope', '$q', '$indexedDB', 'dataService', '$anchorScroll', '$location', '$modal', dataEntryController]);
        app.controller('orgUnitContoller', ['$scope', '$indexedDB', 'projectsService', '$q', '$location', '$timeout', '$anchorScroll', orgUnitContoller]);
        app.controller('mainController', ['$rootScope', 'ngI18nResourceBundle', mainController]);
        app.controller('projectController', ['$scope', '$indexedDB', 'projectsService', '$q', '$location', '$timeout', '$anchorScroll', projectController]);
    };
    return {
        init: init
    };
});