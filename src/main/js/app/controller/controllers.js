define(['reportsController', 'moduleWeekSelectorController', 'headerController', 'orgUnitController', 'loginController', 'opUnitController', 'aggregateModuleController',
        'lineListModuleController', 'projectController', 'countryController', 'confirmDialogController', 'projectUserController',
        'aggregateDataEntryController', 'lineListDataEntryController', 'patientOriginController', 'productKeyController',
        'lineListSummaryController', 'dataApprovalController', 'dashboardController', 'lineListOfflineApprovalController', 'appCloneController', 'downloadDataController', 'notificationDialogController', 'selectLanguageController',
        'referralLocationsController', 'notificationsController', 'selectProjectPreferenceController', 'projectReportController', 'footerController', 'exportRawDataController', 'alertDialogController', 'opUnitReportController',
        'downloadMetadataController'
    ],
    function(reportsController, moduleWeekSelectorController, headerController, orgUnitController, loginController, opUnitController, aggregateModuleController,
        lineListModuleController, projectController, countryController, confirmDialogController, projectUserController,
        aggregateDataEntryController, lineListDataEntryController, patientOriginController, productKeyController,
        lineListSummaryController, dataApprovalController, dashboardController, lineListOfflineApprovalController, appCloneController, downloadDataController, notificationDialogController, selectLanguageController,
        referralLocationsController, notificationsController, selectProjectPreferenceController, projectReportController, footerController, exportRawDataController, alertDialogController, opUnitReportController, downloadMetadataController) {

        var init = function(app) {
            app.controller('reportsController', ['$rootScope', '$scope', '$q', '$routeParams', 'dataSetRepository', 'programRepository', 'orgUnitRepository', 'chartRepository', 'pivotTableRepository', 'translationsService', 'filesystemService','changeLogRepository','referralLocationsRepository', reportsController]);
            app.controller('dashboardController', ['$scope', '$hustle', '$q', '$rootScope', '$modal', '$timeout', '$location', '$anchorScroll', 'approvalDataRepository', 'moduleDataBlockFactory', 'checkVersionCompatibility', 'dataSyncFailureRepository', dashboardController]);
            app.controller('moduleWeekSelectorController', ['$scope', '$routeParams', '$q', '$location', '$rootScope', '$modal', 'orgUnitRepository', moduleWeekSelectorController]);
            app.controller('aggregateDataEntryController', ['$scope', '$routeParams', '$q', '$hustle', '$anchorScroll', '$location', '$modal', '$rootScope', '$window', '$timeout', 'dataRepository', 'excludedDataElementsRepository', 'approvalDataRepository', 'orgUnitRepository', 'dataSetRepository', 'programRepository', 'referralLocationsRepository', 'translationsService', 'moduleDataBlockFactory', 'dataSyncFailureRepository', 'optionSetRepository','filesystemService', aggregateDataEntryController]);
            app.controller('dataApprovalController', ['$scope', '$routeParams', '$q', '$hustle', 'dataRepository', 'excludedDataElementsRepository', '$anchorScroll', '$location', '$modal', '$rootScope', '$window', 'approvalDataRepository', '$timeout', 'orgUnitRepository', 'dataSetRepository', 'programRepository', 'referralLocationsRepository', 'translationsService', 'moduleDataBlockFactory', 'dataSyncFailureRepository', dataApprovalController]);
            app.controller('lineListDataEntryController', ['$scope', '$rootScope', '$routeParams', '$route', 'historyService','programEventRepository', 'optionSetRepository', 'orgUnitRepository', 'excludedDataElementsRepository', 'programRepository', 'translationsService', lineListDataEntryController]);
            app.controller('lineListSummaryController', ['$scope', '$rootScope', '$q', '$hustle', '$modal', '$window', '$timeout', '$location', '$anchorScroll', '$routeParams', 'historyService','programRepository', 'programEventRepository', 'excludedDataElementsRepository', 'orgUnitRepository', 'approvalDataRepository', 'dataSyncFailureRepository', 'translationsService', 'filesystemService', 'optionSetRepository', lineListSummaryController]);
            app.controller('orgUnitController', ['$scope', '$q', '$location', '$timeout', '$anchorScroll', '$rootScope', 'orgUnitRepository', orgUnitController]);
            app.controller('opUnitController', ['$scope', '$q', '$hustle', 'orgUnitRepository', 'orgUnitGroupHelper', '$indexedDB', '$location', '$modal', 'patientOriginRepository', 'orgUnitGroupSetRepository', 'translationsService', opUnitController]);
            app.controller('aggregateModuleController', ['$scope', '$rootScope', '$hustle', 'orgUnitRepository', 'dataSetRepository', 'systemSettingRepository', 'excludedDataElementsRepository', '$indexedDB', '$location', '$q', '$modal', '$modalStack', 'orgUnitGroupHelper', 'originOrgunitCreator', 'translationsService', aggregateModuleController]);
            app.controller('lineListModuleController', ['$scope', '$rootScope', '$hustle', 'orgUnitRepository', 'excludedDataElementsRepository', '$q', '$modal', '$modalStack', 'programRepository', 'orgUnitGroupHelper', 'dataSetRepository', 'originOrgunitCreator', 'translationsService', 'excludedLineListOptionsRepository', lineListModuleController]);
            app.controller('projectController', ['$scope', '$rootScope', '$hustle', 'orgUnitRepository', '$q', 'orgUnitGroupHelper', 'orgUnitGroupSetRepository', 'translationsService', projectController]);
            app.controller('loginController', ['$rootScope', '$scope', '$location', '$q', 'sessionHelper', '$hustle', 'userPreferenceRepository', 'orgUnitRepository', 'systemSettingRepository','userRepository', 'checkVersionCompatibility','storageService', loginController]);
            app.controller('countryController', ['$scope', '$hustle', 'orgUnitRepository', '$q', '$location', '$timeout', '$anchorScroll', countryController]);
            app.controller('confirmDialogController', ['$scope', '$modalInstance', confirmDialogController]);
            app.controller('notificationDialogController', ['$scope', '$modalInstance', notificationDialogController]);
            app.controller('projectUserController', ['$scope', '$hustle', '$timeout', '$modal', 'userRepository', projectUserController]);
            app.controller('patientOriginController', ['$scope', '$hustle', '$q', 'patientOriginRepository', 'orgUnitRepository', 'dataSetRepository', 'programRepository', 'originOrgunitCreator', 'orgUnitGroupHelper', patientOriginController]);
            app.controller('productKeyController', ['$scope', '$location', '$rootScope', '$modal', 'packagedDataImporter', 'sessionHelper', 'systemSettingRepository', productKeyController]);
            app.controller('lineListOfflineApprovalController', ['$scope', '$q', 'programEventRepository', 'orgUnitRepository', 'programRepository', 'optionSetRepository', 'dataSetRepository', 'referralLocationsRepository', 'excludedDataElementsRepository', 'translationsService', lineListOfflineApprovalController]);
            app.controller('appCloneController', ['$scope', '$modal', '$timeout', 'indexeddbUtils', 'filesystemService', 'sessionHelper', '$location', '$rootScope', appCloneController]);
            app.controller('downloadDataController', ['$scope', '$hustle', '$q', '$rootScope', '$timeout', downloadDataController]);
            app.controller('selectLanguageController', ['$scope', '$rootScope', selectLanguageController]);
            app.controller('referralLocationsController', ['$scope', '$hustle', '$modal', 'referralLocationsRepository', 'dataSetRepository', 'translationsService', referralLocationsController]);
            app.controller('notificationsController', ['$scope', '$q', '$rootScope', 'userPreferenceRepository', 'orgUnitRepository', 'translationsService', 'pivotTableRepository', 'chartRepository', 'systemSettingRepository', notificationsController]);
            app.controller('selectProjectPreferenceController', ['$rootScope', '$scope', '$hustle', '$location', 'orgUnitRepository', 'userPreferenceRepository', 'systemSettingRepository', selectProjectPreferenceController]);
            app.controller('projectReportController', ['$rootScope', '$q', '$scope', 'orgUnitRepository','pivotTableRepository', 'changeLogRepository', 'translationsService', 'orgUnitGroupSetRepository', 'filesystemService', 'pivotTableExportBuilder', projectReportController]);
            app.controller('headerController', ['$q', '$scope', '$location', '$rootScope', '$hustle', '$timeout', '$modal', 'sessionHelper', 'orgUnitRepository', 'systemSettingRepository', 'changeLogRepository', 'dhisMonitor', headerController]);
            app.controller('footerController', ['$rootScope', '$scope','systemSettingRepository', footerController]);
            app.controller('exportRawDataController', ['$scope', '$q', 'dataSetRepository', 'excludedDataElementsRepository', 'orgUnitRepository', 'referralLocationsRepository', 'moduleDataBlockFactory', 'filesystemService', 'translationsService', 'programRepository', 'programEventRepository', 'excludedLineListOptionsRepository', 'categoryRepository', exportRawDataController]);
            app.controller('alertDialogController', ['$scope', '$modalInstance', alertDialogController]);
            app.controller('opUnitReportController', ['$rootScope', '$q', '$scope', '$routeParams', 'orgUnitRepository','changeLogRepository','pivotTableRepository', 'filesystemService', 'translationsService', 'pivotTableExportBuilder', opUnitReportController]);
            app.controller('downloadMetadataController', ['$scope', '$q', '$location', '$log', 'metadataDownloader','packagedDataImporter', downloadMetadataController]);
        };
        return {
            init: init
        };
    });
