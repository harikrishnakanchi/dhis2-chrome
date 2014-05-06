define(['dashboardController', 'dataEntryController', 'mainController', 'orgUnitContoller', 'loginController', 'opUnitController', 'moduleController', 'projectController', 'countryController', 'saveDialogController'],
    function(dashboardController, dataEntryController, mainController, orgUnitContoller, loginController, opUnitController, moduleController, projectController, countryController, saveDialogController) {
        var init = function(app) {
            app.controller('dashboardController', ['$scope', '$q', 'dataService', dashboardController]);
            app.controller('dataEntryController', ['$scope', '$q', '$indexedDB', 'dataService', '$anchorScroll', '$location', '$modal', dataEntryController]);
            app.controller('orgUnitContoller', ['$scope', '$indexedDB', '$q', '$location', '$timeout', '$anchorScroll', orgUnitContoller]);
            app.controller('opUnitController', ['$scope', 'orgUnitService', '$indexedDB', '$location', opUnitController]);
            app.controller('moduleController', ['$scope', 'orgUnitService', '$indexedDB', '$location', '$q', moduleController]);
            app.controller('projectController', ['$scope', 'orgUnitService', '$q', '$location', '$timeout', '$anchorScroll', projectController]);
            app.controller('mainController', ['$scope', '$rootScope', 'ngI18nResourceBundle', mainController]);
            app.controller('loginController', ['$scope', '$rootScope', '$location', '$indexedDB', loginController]);
            app.controller('countryController', ['$scope', 'orgUnitService', '$q', '$location', '$timeout', '$anchorScroll', countryController]);
            app.controller('saveDialogController', ['$scope', '$modalInstance', saveDialogController]);
        };
        return {
            init: init
        };
    });