define(['reportsController', 'dataEntryController', 'mainController', 'orgUnitContoller', 'loginController', 'opUnitController', 'aggregateModuleController',
        'lineListModuleController', 'projectController', 'countryController', 'confirmDialogController', 'projectUserController',
        'aggregateDataEntryController', 'lineListDataEntryController', 'patientOriginController', 'productKeyController',
        'lineListSummaryController', 'dataApprovalController', 'dashboardController', 'lineListOfflineApprovalController', 'appCloneController', 'downloadDataController', 'notificationDialogController', 'selectLanguageController',
        'referralLocationsController', 'notificationsController', 'selectProjectPreferenceController', 'projectReportController'
    ],
    function(reportsController, dataEntryController, mainController, orgUnitContoller, loginController, opUnitController, aggregateModuleController,
        lineListModuleController, projectController, countryController, confirmDialogController, projectUserController,
        aggregateDataEntryController, lineListDataEntryController, patientOriginController, productKeyController,
        lineListSummaryController, dataApprovalController, dashboardController, lineListOfflineApprovalController, appCloneController, downloadDataController, notificationDialogController, selectLanguageController,
        referralLocationsController, notificationsController, selectProjectPreferenceController, projectReportController) {

        var init = function(app) {
            app.controller('reportsController', ['$scope', '$q', '$routeParams', 'datasetRepository', 'orgUnitRepository', 'chartRepository', 'pivotTableRepository', 'translationsService', reportsController]);
            app.controller('dashboardController', ['$scope', '$hustle', '$q', '$rootScope', '$modal', '$timeout', '$location', 'approvalDataRepository', 'moduleDataBlockFactory', dashboardController]);
            app.controller('dataEntryController', ['$scope', '$routeParams', '$q', '$location', '$rootScope', 'orgUnitRepository', dataEntryController]);
            app.controller('aggregateDataEntryController', ['$scope', '$routeParams', '$q', '$hustle', '$anchorScroll', '$location', '$modal', '$rootScope', '$window', '$timeout', 'dataRepository', 'excludedDataElementsRepository', 'approvalDataRepository', 'orgUnitRepository', 'datasetRepository', 'programRepository', 'referralLocationsRepository', 'translationsService', aggregateDataEntryController]);
            app.controller('dataApprovalController', ['$scope', '$routeParams', '$q', '$hustle', 'dataRepository', 'excludedDataElementsRepository', '$anchorScroll', '$location', '$modal', '$rootScope', '$window', 'approvalDataRepository', '$timeout', 'orgUnitRepository', 'datasetRepository', 'programRepository', 'referralLocationsRepository', 'translationsService', dataApprovalController]);
            app.controller('lineListDataEntryController', ['$scope', '$rootScope', '$routeParams', '$location', '$anchorScroll', 'programEventRepository', 'optionSetRepository', 'orgUnitRepository', 'excludedDataElementsRepository', 'programRepository', lineListDataEntryController]);
            app.controller('lineListSummaryController', ['$scope', '$q', '$hustle', '$modal', '$window', '$timeout', '$location', '$anchorScroll', '$routeParams', 'programRepository', 'programEventRepository', 'excludedDataElementsRepository', 'orgUnitRepository', 'approvalDataRepository', 'referralLocationsRepository', lineListSummaryController]);
            app.controller('orgUnitContoller', ['$scope', '$q', '$location', '$timeout', '$anchorScroll', '$rootScope', 'orgUnitRepository', orgUnitContoller]);
            app.controller('opUnitController', ['$scope', '$q', '$hustle', 'orgUnitRepository', 'orgUnitGroupHelper', '$indexedDB', '$location', '$modal', 'patientOriginRepository', 'orgUnitGroupSetRepository', opUnitController]);
            app.controller('aggregateModuleController', ['$scope', '$hustle', 'orgUnitRepository', 'datasetRepository', 'systemSettingRepository', 'excludedDataElementsRepository', '$indexedDB', '$location', '$q', '$modal', 'orgUnitGroupHelper', 'originOrgunitCreator', aggregateModuleController]);
            app.controller('lineListModuleController', ['$scope', '$hustle', 'orgUnitRepository', 'excludedDataElementsRepository', '$q', '$modal', 'programRepository', 'orgUnitGroupHelper', 'datasetRepository', 'originOrgunitCreator', 'translationsService', lineListModuleController]);
            app.controller('projectController', ['$scope', '$rootScope', '$hustle', 'orgUnitRepository', '$q', 'orgUnitGroupHelper', 'approvalDataRepository', 'orgUnitGroupSetRepository', 'translationsService', projectController]);
            app.controller('mainController', ['$q', '$scope', '$location', '$rootScope', '$hustle', '$timeout', 'ngI18nResourceBundle', '$indexedDB', 'packagedDataImporter', 'sessionHelper', 'orgUnitRepository', 'systemSettingRepository', 'dhisMonitor', mainController]);
            app.controller('loginController', ['$rootScope', '$scope', '$location', '$q', 'sessionHelper', '$hustle', 'userPreferenceRepository', 'orgUnitRepository', 'systemSettingRepository','userRepository', loginController]);
            app.controller('countryController', ['$scope', '$hustle', 'orgUnitRepository', '$q', '$location', '$timeout', '$anchorScroll', countryController]);
            app.controller('confirmDialogController', ['$scope', '$modalInstance', confirmDialogController]);
            app.controller('notificationDialogController', ['$scope', '$modalInstance', notificationDialogController]);
            app.controller('projectUserController', ['$scope', '$hustle', '$timeout', '$modal', 'userRepository', projectUserController]);
            app.controller('patientOriginController', ['$scope', '$hustle', '$q', 'patientOriginRepository', 'orgUnitRepository', 'datasetRepository', 'programRepository', 'originOrgunitCreator', 'orgUnitGroupHelper', patientOriginController]);
            app.controller('productKeyController', ['$scope', '$location', '$rootScope', 'packagedDataImporter', 'sessionHelper', 'systemSettingRepository', productKeyController]);
            app.controller('lineListOfflineApprovalController', ['$scope', '$q', 'programEventRepository', 'orgUnitRepository', 'programRepository', 'optionSetRepository', 'datasetRepository', 'referralLocationsRepository', 'excludedDataElementsRepository', 'translationsService', lineListOfflineApprovalController]);
            app.controller('appCloneController', ['$scope', '$modal', '$timeout', 'indexeddbUtils', 'filesystemService', 'sessionHelper', '$location', '$rootScope', appCloneController]);
            app.controller('downloadDataController', ['$scope', '$hustle', '$q', '$rootScope', '$timeout', downloadDataController]);
            app.controller('selectLanguageController', ['$scope', '$rootScope', '$q', '$indexedDB', 'ngI18nResourceBundle', 'systemSettingRepository', 'translationsService', selectLanguageController]);
            app.controller('referralLocationsController', ['$scope', '$hustle', '$modal', 'referralLocationsRepository', referralLocationsController]);
            app.controller('notificationsController', ['$scope', '$q', '$rootScope', 'userPreferenceRepository', 'chartRepository', 'orgUnitRepository', notificationsController]);
            app.controller('selectProjectPreferenceController', ['$rootScope', '$scope', '$hustle', '$location', 'orgUnitRepository', 'userPreferenceRepository', 'systemSettingRepository', selectProjectPreferenceController]);
            app.controller('projectReportController', ['$rootScope', '$q', '$scope', 'orgUnitRepository','pivotTableRepository', 'translationsService', projectReportController]);
        };
        return {
            init: init
        };
    });
