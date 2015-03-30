define(['dashboardController', 'dataEntryController', 'mainController', 'orgUnitContoller', 'loginController', 'opUnitController', 'moduleController', 'lineListModuleController', 'projectController', 'countryController', 'confirmDialogController',
        'projectUserController', 'selectProjectController', 'aggregateDataEntryController', 'lineListDataEntryController', 'indicatorController', 'patientOriginController', 'productKeyController',
        'lineListSummaryController'
    ],
    function(dashboardController, dataEntryController, mainController, orgUnitContoller, loginController, opUnitController, moduleController, lineListModuleController, projectController, countryController, confirmDialogController,
        projectUserController, selectProjectController, aggregateDataEntryController, lineListDataEntryController, indicatorController, patientOriginController, productKeyController,
        lineListSummaryController) {
        var init = function(app) {
            app.controller('dashboardController', ['$scope', '$hustle', '$q', '$rootScope', 'approvalHelper', 'datasetRepository', '$modal', '$timeout', 'indexeddbUtils', 'filesystemService', 'sessionHelper', '$location', 'approvalDataRepository', dashboardController]);
            app.controller('dataEntryController', ['$scope', '$routeParams', '$q', '$location', '$rootScope', 'orgUnitRepository', 'programRepository', dataEntryController]);
            app.controller('aggregateDataEntryController', ['$scope', '$routeParams', '$q', '$hustle', '$indexedDB', 'dataRepository', 'systemSettingRepository', '$anchorScroll', '$location', '$modal', '$rootScope', '$window', 'approvalDataRepository', '$timeout', 'orgUnitRepository', aggregateDataEntryController]);
            app.controller('lineListDataEntryController', ['$scope', '$indexedDB', 'programEventRepository', lineListDataEntryController]);
            app.controller('lineListSummaryController', ['$scope', '$q', '$hustle', '$modal', '$timeout', '$location', '$anchorScroll', 'programRepository', 'programEventRepository', 'systemSettingRepository', 'orgUnitRepository', 'approvalDataRepository', lineListSummaryController]);
            app.controller('orgUnitContoller', ['$scope', '$indexedDB', '$q', '$location', '$timeout', '$anchorScroll', 'orgUnitRepository', orgUnitContoller]);
            app.controller('opUnitController', ['$scope', '$q', '$hustle', 'orgUnitRepository', 'orgUnitGroupHelper', '$indexedDB', '$location', '$modal', 'patientOriginRepository', opUnitController]);
            app.controller('moduleController', ['$scope', '$hustle', 'orgUnitRepository', 'datasetRepository', 'systemSettingRepository', '$indexedDB', '$location', '$q', '$modal', 'programRepository', 'orgUnitGroupRepository', 'orgUnitGroupHelper', 'patientOriginRepository', moduleController]);
            app.controller('lineListModuleController', ['$scope', '$hustle', 'orgUnitRepository', 'systemSettingRepository', '$indexedDB', '$location', '$q', '$modal', 'programRepository', 'orgUnitGroupRepository', 'orgUnitGroupHelper', 'datasetRepository', 'patientOriginRepository', lineListModuleController]);
            app.controller('projectController', ['$scope', '$rootScope', '$hustle', 'orgUnitRepository', '$q', '$location', '$timeout', '$anchorScroll', 'userRepository', '$modal', 'orgUnitGroupHelper', 'approvalDataRepository', projectController]);
            app.controller('mainController', ['$q', '$scope', '$location', '$rootScope', 'ngI18nResourceBundle', '$indexedDB', 'userPreferenceRepository', 'orgUnitRepository', 'userRepository', 'metadataImporter', 'sessionHelper', mainController]);
            app.controller('loginController', ['$scope', '$rootScope', '$location', '$indexedDB', '$q', '$hustle', 'userPreferenceRepository', loginController]);
            app.controller('countryController', ['$scope', '$hustle', 'orgUnitRepository', '$q', '$location', '$timeout', '$anchorScroll', countryController]);
            app.controller('confirmDialogController', ['$scope', '$modalInstance', confirmDialogController]);
            app.controller('projectUserController', ['$scope', '$hustle', 'userRepository', projectUserController]);
            app.controller('selectProjectController', ['$scope', '$location', '$rootScope', 'orgUnitRepository', 'userRepository', 'userPreferenceRepository', selectProjectController]);
            app.controller('indicatorController', ['$scope', 'indicatorRepository', indicatorController]);
            app.controller('patientOriginController', ['$scope', '$hustle', '$q', 'patientOriginRepository', 'orgUnitRepository', 'datasetRepository', 'programRepository', patientOriginController]);
            app.controller('productKeyController', ['$scope', '$location', '$rootScope', 'metadataImporter', productKeyController]);
        };
        return {
            init: init
        };
    });