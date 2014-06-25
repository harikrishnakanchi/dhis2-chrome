define(['dashboardController', 'dataEntryController', 'mainController', 'orgUnitContoller', 'loginController', 'opUnitController', 'moduleController', 'projectController', 'countryController', 'confirmDialogController',
        'projectUserController'
    ],
    function(dashboardController, dataEntryController, mainController, orgUnitContoller, loginController, opUnitController, moduleController, projectController, countryController, confirmDialogController,
        projectUserController) {
        var init = function(app) {
            app.controller('dashboardController', ['$scope', '$hustle', '$q', dashboardController]);
            app.controller('dataEntryController', ['$scope', '$q', '$hustle', '$indexedDB', 'dataRepository', '$anchorScroll', '$location', '$modal', '$rootScope', '$window', 'approvalService', dataEntryController]);
            app.controller('orgUnitContoller', ['$scope', '$indexedDB', '$q', '$location', '$timeout', '$anchorScroll', orgUnitContoller]);
            app.controller('opUnitController', ['$scope', 'orgUnitService', 'orgUnitRepository', '$indexedDB', '$location', opUnitController]);
            app.controller('moduleController', ['$scope', 'orgUnitService', 'orgUnitRepository', '$indexedDB', '$location', '$q', moduleController]);
            app.controller('projectController', ['$scope', 'orgUnitService', 'orgUnitRepository', '$q', '$location', '$timeout', '$anchorScroll', 'userService', '$modal', projectController]);
            app.controller('mainController', ['$scope', '$rootScope', 'ngI18nResourceBundle', '$indexedDB', 'userPreferenceRepository', 'dhisMonitor', mainController]);
            app.controller('loginController', ['$scope', '$rootScope', '$location', '$indexedDB', '$q', '$hustle', 'userPreferenceRepository', loginController]);
            app.controller('countryController', ['$scope', 'orgUnitService', 'orgUnitRepository', '$q', '$location', '$timeout', '$anchorScroll', countryController]);
            app.controller('confirmDialogController', ['$scope', '$modalInstance', confirmDialogController]);
            app.controller('projectUserController', ['$scope', 'userService', projectUserController]);
        };
        return {
            init: init
        };
    });