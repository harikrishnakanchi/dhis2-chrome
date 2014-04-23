define(['dashboardController', 'dataEntryController', 'mainController', 'orgUnitContoller', 'loginController', 'opUnitController', 'moduleController', 'projectController'],
    function(dashboardController, dataEntryController, mainController, orgUnitContoller, loginController, opUnitController, moduleController, projectController) {
        var init = function(app) {
            app.controller('dashboardController', ['$scope', '$q', 'dataService', dashboardController]);
            app.controller('dataEntryController', ['$scope', '$q', '$indexedDB', 'dataService', '$anchorScroll', '$location', '$modal', dataEntryController]);
            app.controller('orgUnitContoller', ['$scope', '$indexedDB', 'projectsService', '$q', '$location', '$timeout', '$anchorScroll', orgUnitContoller]);
            app.controller('opUnitController', ['$scope', opUnitController]);
            app.controller('moduleController', ['$scope', moduleController]);
            app.controller('projectController', ['$scope', '$indexedDB', 'projectsService', '$q', '$location', '$timeout', '$anchorScroll', projectController]);
            app.controller('mainController', ['$scope', '$rootScope', 'ngI18nResourceBundle', mainController]);
            app.controller('loginController', ['$scope', '$rootScope', '$location', '$indexedDB', loginController]);
        };
        return {
            init: init
        };
    });