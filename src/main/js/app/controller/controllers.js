define(['dashboardController', 'dataEntryController', 'mainController', 'orgUnitContoller', 'loginController', 'opUnitController', 'moduleController', 'projectController', 'countryController', 'confirmDialogController',
        'projectUserController', 'selectProjectController'
    ],
    function(dashboardController, dataEntryController, mainController, orgUnitContoller, loginController, opUnitController, moduleController, projectController, countryController, confirmDialogController,
        projectUserController, selectProjectController) {
        var init = function(app) {
            app.controller('dashboardController', ['$scope', '$hustle', '$q', dashboardController]);
            app.controller('dataEntryController', ['$scope', '$q', '$hustle', '$indexedDB', 'dataRepository', '$anchorScroll', '$location', '$modal', '$rootScope', '$window', 'approvalDataRepository', dataEntryController]);
            app.controller('orgUnitContoller', ['$scope', '$indexedDB', '$q', '$location', '$timeout', '$anchorScroll', orgUnitContoller]);
            app.controller('opUnitController', ['$scope', '$hustle', 'orgUnitRepository', '$indexedDB', '$location', opUnitController]);
            app.controller('moduleController', ['$scope', '$hustle', 'orgUnitService', 'orgUnitRepository', 'dataSetRepository', 'systemSettingRepository', '$indexedDB', '$location', '$q', moduleController]);
            app.controller('projectController', ['$scope', '$hustle', 'orgUnitRepository', '$q', '$location', '$timeout', '$anchorScroll', 'userRepository', '$modal', projectController]);
            app.controller('mainController', ['$scope', '$location', '$rootScope', 'ngI18nResourceBundle', '$indexedDB', 'userPreferenceRepository', 'orgUnitRepository', 'userRepository', mainController]);
            app.controller('loginController', ['$scope', '$rootScope', '$location', '$indexedDB', '$q', '$hustle', 'userPreferenceRepository', loginController]);
            app.controller('countryController', ['$scope', '$hustle', 'orgUnitRepository', '$q', '$location', '$timeout', '$anchorScroll', countryController]);
            app.controller('confirmDialogController', ['$scope', '$modalInstance', confirmDialogController]);
            app.controller('projectUserController', ['$scope', '$hustle', 'userRepository', projectUserController]);
            app.controller('selectProjectController', ['$scope', '$location', '$rootScope', 'orgUnitRepository', 'userRepository', 'userPreferenceRepository', selectProjectController]);
        };
        return {
            init: init
        };
    });