define(['reportsController', 'moduleWeekSelectorController', 'headerController', 'orgUnitContoller', 'loginController', 'opUnitController', 'aggregateModuleController',
        'lineListModuleController', 'projectController', 'countryController', 'confirmDialogController', 'projectUserController',
        'aggregateDataEntryController', 'lineListDataEntryController', 'patientOriginController', 'productKeyController',
        'lineListSummaryController', 'dataApprovalController', 'dashboardController', 'lineListOfflineApprovalController', 'appCloneController', 'downloadDataController', 'notificationDialogController', 'selectLanguageController',
        'referralLocationsController', 'notificationsController', 'selectProjectPreferenceController', 'projectReportController', 'footerController', 'exportRawDataController'
    ],
    function(reportsController, moduleWeekSelectorController, headerController, orgUnitContoller, loginController, opUnitController, aggregateModuleController,
        lineListModuleController, projectController, countryController, confirmDialogController, projectUserController,
        aggregateDataEntryController, lineListDataEntryController, patientOriginController, productKeyController,
        lineListSummaryController, dataApprovalController, dashboardController, lineListOfflineApprovalController, appCloneController, downloadDataController, notificationDialogController, selectLanguageController,
        referralLocationsController, notificationsController, selectProjectPreferenceController, projectReportController, footerController, exportRawDataController) {

        var init = function(app) {
            app.controller('reportsController', ['$scope', '$q', '$routeParams', 'datasetRepository', 'orgUnitRepository', 'chartRepository', 'pivotTableRepository', 'translationsService', 'filesystemService', reportsController]);
            app.controller('dashboardController', ['$scope', '$hustle', '$q', '$rootScope', '$modal', '$timeout', '$location', 'approvalDataRepository', 'moduleDataBlockFactory', 'checkVersionCompatibility', 'dataSyncFailureRepository', dashboardController]);
            app.controller('moduleWeekSelectorController', ['$scope', '$routeParams', '$q', '$location', '$rootScope', 'orgUnitRepository', moduleWeekSelectorController]);
            app.controller('aggregateDataEntryController', ['$scope', '$routeParams', '$q', '$hustle', '$anchorScroll', '$location', '$modal', '$rootScope', '$window', '$timeout', 'dataRepository', 'excludedDataElementsRepository', 'approvalDataRepository', 'orgUnitRepository', 'datasetRepository', 'programRepository', 'referralLocationsRepository', 'translationsService', 'moduleDataBlockFactory', 'dataSyncFailureRepository', aggregateDataEntryController]);
            app.controller('dataApprovalController', ['$scope', '$routeParams', '$q', '$hustle', 'dataRepository', 'excludedDataElementsRepository', '$anchorScroll', '$location', '$modal', '$rootScope', '$window', 'approvalDataRepository', '$timeout', 'orgUnitRepository', 'datasetRepository', 'programRepository', 'referralLocationsRepository', 'translationsService', 'moduleDataBlockFactory', 'dataSyncFailureRepository', dataApprovalController]);
            app.controller('lineListDataEntryController', ['$scope', '$rootScope', '$routeParams', '$location', '$anchorScroll', 'programEventRepository', 'optionSetRepository', 'orgUnitRepository', 'excludedDataElementsRepository', 'programRepository', 'translationsService', lineListDataEntryController]);
            app.controller('lineListSummaryController', ['$scope', '$q', '$hustle', '$modal', '$window', '$timeout', '$location', '$anchorScroll', '$routeParams', 'programRepository', 'programEventRepository', 'excludedDataElementsRepository', 'orgUnitRepository', 'approvalDataRepository', 'referralLocationsRepository', 'dataSyncFailureRepository', 'translationsService', 'filesystemService', lineListSummaryController]);
            app.controller('orgUnitContoller', ['$scope', '$q', '$location', '$timeout', '$anchorScroll', '$rootScope', 'orgUnitRepository', orgUnitContoller]);
            app.controller('opUnitController', ['$scope', '$q', '$hustle', 'orgUnitRepository', 'orgUnitGroupHelper', '$indexedDB', '$location', '$modal', 'patientOriginRepository', 'orgUnitGroupSetRepository', opUnitController]);
            app.controller('aggregateModuleController', ['$scope', '$hustle', 'orgUnitRepository', 'datasetRepository', 'systemSettingRepository', 'excludedDataElementsRepository', '$indexedDB', '$location', '$q', '$modal', 'orgUnitGroupHelper', 'originOrgunitCreator', 'translationsService', aggregateModuleController]);
            app.controller('lineListModuleController', ['$scope', '$hustle', 'orgUnitRepository', 'excludedDataElementsRepository', '$q', '$modal', 'programRepository', 'orgUnitGroupHelper', 'datasetRepository', 'originOrgunitCreator', 'translationsService', lineListModuleController]);
            app.controller('projectController', ['$scope', '$rootScope', '$hustle', 'orgUnitRepository', '$q', 'orgUnitGroupHelper', 'approvalDataRepository', 'orgUnitGroupSetRepository', 'translationsService', projectController]);
            app.controller('loginController', ['$rootScope', '$scope', '$location', '$q', 'sessionHelper', '$hustle', 'userPreferenceRepository', 'orgUnitRepository', 'systemSettingRepository','userRepository', 'checkVersionCompatibility','translationsService', loginController]);
            app.controller('countryController', ['$scope', '$hustle', 'orgUnitRepository', '$q', '$location', '$timeout', '$anchorScroll', countryController]);
            app.controller('confirmDialogController', ['$scope', '$modalInstance', confirmDialogController]);
            app.controller('notificationDialogController', ['$scope', '$modalInstance', notificationDialogController]);
            app.controller('projectUserController', ['$scope', '$hustle', '$timeout', '$modal', 'userRepository', projectUserController]);
            app.controller('patientOriginController', ['$scope', '$hustle', '$q', 'patientOriginRepository', 'orgUnitRepository', 'datasetRepository', 'programRepository', 'originOrgunitCreator', 'orgUnitGroupHelper', patientOriginController]);
            app.controller('productKeyController', ['$scope', '$location', '$rootScope', 'packagedDataImporter', 'sessionHelper', 'systemSettingRepository', productKeyController]);
            app.controller('lineListOfflineApprovalController', ['$scope', '$q', 'programEventRepository', 'orgUnitRepository', 'programRepository', 'optionSetRepository', 'datasetRepository', 'referralLocationsRepository', 'excludedDataElementsRepository', 'translationsService', lineListOfflineApprovalController]);
            app.controller('appCloneController', ['$scope', '$modal', '$timeout', 'indexeddbUtils', 'filesystemService', 'sessionHelper', '$location', '$rootScope', appCloneController]);
            app.controller('downloadDataController', ['$scope', '$hustle', '$q', '$rootScope', '$timeout', downloadDataController]);
            app.controller('selectLanguageController', ['$scope', '$rootScope', selectLanguageController]);
            app.controller('referralLocationsController', ['$scope', '$hustle', '$modal', 'referralLocationsRepository', 'datasetRepository', 'translationsService', referralLocationsController]);
            app.controller('notificationsController', ['$scope', '$q', '$rootScope', 'userPreferenceRepository', 'chartRepository', 'orgUnitRepository', notificationsController]);
            app.controller('selectProjectPreferenceController', ['$rootScope', '$scope', '$hustle', '$location', 'orgUnitRepository', 'userPreferenceRepository', 'systemSettingRepository', selectProjectPreferenceController]);
            app.controller('projectReportController', ['$rootScope', '$q', '$scope', 'orgUnitRepository','pivotTableRepository', 'translationsService', 'orgUnitGroupSetRepository', 'filesystemService', projectReportController]);
            app.controller('headerController', ['$q', '$scope', '$location', '$rootScope', '$hustle', '$timeout', '$indexedDB', 'sessionHelper', 'orgUnitRepository', 'systemSettingRepository', 'dhisMonitor', headerController]);
            app.controller('footerController', ['$rootScope', '$scope', '$interpolate','systemSettingRepository', footerController]);
            app.controller('exportRawDataController', ['$scope', '$q', 'datasetRepository', 'excludedDataElementsRepository', 'orgUnitRepository', 'referralLocationsRepository', 'moduleDataBlockFactory', 'filesystemService', 'translationsService', exportRawDataController]);
        };
        return {
            init: init
        };
    });
