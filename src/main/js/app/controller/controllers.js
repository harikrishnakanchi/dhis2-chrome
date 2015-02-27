define(['dashboardController', 'dataEntryController', 'mainController', 'orgUnitContoller', 'loginController', 'opUnitController', 'moduleController', 'lineListModuleController', 'projectController', 'countryController', 'confirmDialogController',
        'projectUserController', 'selectProjectController', 'aggregateDataEntryController', 'lineListDataEntryController', 'indicatorController'
    ],
    function(dashboardController, dataEntryController, mainController, orgUnitContoller, loginController, opUnitController, moduleController, lineListModuleController, projectController, countryController, confirmDialogController,
        projectUserController, selectProjectController, aggregateDataEntryController, lineListDataEntryController, indicatorController) {
        var init = function(app) {
            app.controller('dashboardController', ['$scope', '$hustle', '$q', '$rootScope', 'approvalHelper', 'datasetRepository', '$modal', '$timeout', 'indexeddbUtils', 'filesystemService', 'sessionHelper', '$location', dashboardController]);
            app.controller('dataEntryController', ['$scope', '$routeParams', '$q', '$location', '$rootScope', 'orgUnitRepository', 'programRepository', dataEntryController]);
            app.controller('aggregateDataEntryController', ['$scope', '$routeParams', '$q', '$hustle', '$indexedDB', 'dataRepository', 'systemSettingRepository', '$anchorScroll', '$location', '$modal', '$rootScope', '$window', 'approvalDataRepository', '$timeout', 'orgUnitRepository', 'approvalHelper', aggregateDataEntryController]);
            app.controller('lineListDataEntryController', ['$scope', '$q', '$hustle', '$modal', '$timeout', '$location', '$anchorScroll', '$indexedDB', 'programRepository', 'programEventRepository', 'dataElementRepository', 'systemSettingRepository', 'orgUnitRepository', 'approvalHelper', 'approvalDataRepository', lineListDataEntryController]);
            app.controller('orgUnitContoller', ['$scope', '$indexedDB', '$q', '$location', '$timeout', '$anchorScroll', 'orgUnitRepository', orgUnitContoller]);
            app.controller('opUnitController', ['$scope', '$q', '$hustle', 'orgUnitRepository', 'orgUnitGroupHelper', '$indexedDB', '$location', '$modal', opUnitController]);
            app.controller('moduleController', ['$scope', '$hustle', 'orgUnitRepository', 'datasetRepository', 'systemSettingRepository', '$indexedDB', '$location', '$q', '$modal', 'programRepository', 'orgUnitGroupRepository', 'orgUnitGroupHelper', moduleController]);
            app.controller('lineListModuleController', ['$scope', '$hustle', 'orgUnitRepository', 'systemSettingRepository', '$indexedDB', '$location', '$q', '$modal', 'programRepository', 'orgUnitGroupRepository', 'orgUnitGroupHelper', 'datasetRepository', lineListModuleController]);
            app.controller('projectController', ['$scope', '$rootScope', '$hustle', 'orgUnitRepository', '$q', '$location', '$timeout', '$anchorScroll', 'userRepository', '$modal', 'approvalHelper', 'orgUnitGroupHelper', projectController]);
            app.controller('mainController', ['$scope', '$location', '$rootScope', 'ngI18nResourceBundle', '$indexedDB', 'userPreferenceRepository', 'orgUnitRepository', 'userRepository', 'metadataImporter', 'sessionHelper', mainController]);
            app.controller('loginController', ['$scope', '$rootScope', '$location', '$indexedDB', '$q', '$hustle', 'userPreferenceRepository', loginController]);
            app.controller('countryController', ['$scope', '$hustle', 'orgUnitRepository', '$q', '$location', '$timeout', '$anchorScroll', countryController]);
            app.controller('confirmDialogController', ['$scope', '$modalInstance', confirmDialogController]);
            app.controller('projectUserController', ['$scope', '$hustle', 'userRepository', projectUserController]);
            app.controller('selectProjectController', ['$scope', '$location', '$rootScope', 'orgUnitRepository', 'userRepository', 'userPreferenceRepository', selectProjectController]);
            app.controller('indicatorController', ['$scope', 'indicatorRepository', indicatorController]);
        };
        return {
            init: init
        };
    });
