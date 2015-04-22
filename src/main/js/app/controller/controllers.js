define(['dashboardController', 'dataEntryController', 'mainController', 'orgUnitContoller', 'loginController', 'opUnitController', 'aggregateModuleController',
        'lineListModuleController', 'projectController', 'countryController', 'confirmDialogController', 'projectUserController', 'selectProjectController',
        'aggregateDataEntryController', 'lineListDataEntryController', 'indicatorController', 'patientOriginController', 'productKeyController',
        'lineListSummaryController', 'dataApprovalController', 'dataEntryApprovalDashboardController', 'lineListOfflineApprovalController', 'appCloneController'
    ],
    function(dashboardController, dataEntryController, mainController, orgUnitContoller, loginController, opUnitController, aggregateModuleController,
        lineListModuleController, projectController, countryController, confirmDialogController, projectUserController, selectProjectController,
        aggregateDataEntryController, lineListDataEntryController, indicatorController, patientOriginController, productKeyController,
        lineListSummaryController, dataApprovalController, dataEntryApprovalDashboardController, lineListOfflineApprovalController, appCloneController) {

        var init = function(app) {
            app.controller('dashboardController', ['$scope', '$hustle', '$q', '$rootScope', '$timeout', dashboardController]);
            app.controller('dataEntryApprovalDashboardController', ['$scope', '$hustle', '$q', '$rootScope', '$modal', '$timeout', '$location', 'orgUnitRepository', 'approvalDataRepository', 'dataRepository', dataEntryApprovalDashboardController]);
            app.controller('dataEntryController', ['$scope', '$routeParams', '$q', '$location', '$rootScope', 'orgUnitRepository', dataEntryController]);
            app.controller('aggregateDataEntryController', ['$scope', '$routeParams', '$q', '$hustle', '$anchorScroll', '$location', '$modal', '$rootScope', '$window', '$timeout', 'dataRepository', 'systemSettingRepository', 'approvalDataRepository', 'orgUnitRepository', 'datasetRepository', 'programRepository', aggregateDataEntryController]);
            app.controller('dataApprovalController', ['$scope', '$routeParams', '$q', '$hustle', 'dataRepository', 'systemSettingRepository', '$anchorScroll', '$location', '$modal', '$rootScope', '$window', 'approvalDataRepository', '$timeout', 'orgUnitRepository', 'datasetRepository', 'programRepository', dataApprovalController]);
            app.controller('lineListDataEntryController', ['$scope', '$indexedDB', 'programEventRepository', lineListDataEntryController]);
            app.controller('lineListSummaryController', ['$scope', '$q', '$hustle', '$modal', '$timeout', '$location', '$anchorScroll', 'programRepository', 'programEventRepository', 'systemSettingRepository', 'orgUnitRepository', 'approvalDataRepository', lineListSummaryController]);
            app.controller('orgUnitContoller', ['$scope', '$indexedDB', '$q', '$location', '$timeout', '$anchorScroll', 'orgUnitRepository', orgUnitContoller]);
            app.controller('opUnitController', ['$scope', '$q', '$hustle', 'orgUnitRepository', 'orgUnitGroupHelper', '$indexedDB', '$location', '$modal', 'patientOriginRepository', opUnitController]);
            app.controller('aggregateModuleController', ['$scope', '$hustle', 'orgUnitRepository', 'datasetRepository', 'systemSettingRepository', '$indexedDB', '$location', '$q', '$modal', 'orgUnitGroupHelper', 'originOrgunitCreator', aggregateModuleController]);
            app.controller('lineListModuleController', ['$scope', '$hustle', 'orgUnitRepository', 'systemSettingRepository', '$q', '$modal', 'programRepository', 'orgUnitGroupHelper', 'datasetRepository', 'originOrgunitCreator', lineListModuleController]);
            app.controller('projectController', ['$scope', '$rootScope', '$hustle', 'orgUnitRepository', '$q', '$location', '$timeout', '$anchorScroll', 'userRepository', '$modal', 'orgUnitGroupHelper', 'approvalDataRepository', projectController]);
            app.controller('mainController', ['$q', '$scope', '$location', '$rootScope', 'ngI18nResourceBundle', '$indexedDB', 'userPreferenceRepository', 'orgUnitRepository', 'userRepository', 'metadataImporter', 'sessionHelper', mainController]);
            app.controller('loginController', ['$scope', '$rootScope', '$location', '$indexedDB', '$q', '$hustle', 'userPreferenceRepository', loginController]);
            app.controller('countryController', ['$scope', '$hustle', 'orgUnitRepository', '$q', '$location', '$timeout', '$anchorScroll', countryController]);
            app.controller('confirmDialogController', ['$scope', '$modalInstance', confirmDialogController]);
            app.controller('projectUserController', ['$scope', '$hustle', 'userRepository', projectUserController]);
            app.controller('selectProjectController', ['$scope', '$location', '$rootScope', 'orgUnitRepository', 'userRepository', 'userPreferenceRepository', selectProjectController]);
            app.controller('indicatorController', ['$scope', 'indicatorRepository', indicatorController]);
            app.controller('patientOriginController', ['$scope', '$hustle', '$q', 'patientOriginRepository', 'orgUnitRepository', 'datasetRepository', 'programRepository', 'originOrgunitCreator', 'orgUnitGroupHelper', patientOriginController]);
            app.controller('productKeyController', ['$scope', '$location', '$rootScope', 'metadataImporter', productKeyController]);
            app.controller('lineListOfflineApprovalController', ['$scope', lineListOfflineApprovalController]);
            app.controller('appCloneController', ['$scope', '$modal', '$timeout', 'indexeddbUtils', 'filesystemService', 'sessionHelper', '$location', appCloneController]);
        };
        return {
            init: init
        };
    });
