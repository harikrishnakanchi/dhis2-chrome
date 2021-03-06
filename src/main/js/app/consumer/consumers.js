define(["downloadOrgUnitConsumer", "uploadOrgUnitConsumer", "uploadOrgUnitGroupConsumer", "downloadDataSetConsumer", "assignDataSetsToOrgUnitsConsumer",
        "associateOrgunitToProgramConsumer", "createUserConsumer", "updateUserConsumer", "dispatcher", "consumerRegistry",
        "orgUnitRepository", "programRepository", "uploadProgramConsumer", "downloadProgramConsumer", "eventService", "programEventRepository",
        "downloadMetadataConsumer", "downloadOrgUnitGroupConsumer", "downloadSystemSettingConsumer", "metadataService",
        "metadataRepository", "uploadPatientOriginConsumer", "mergeBy", "downloadPivotTableDataConsumer", "downloadChartDataConsumer", "downloadEventReportDataConsumer", "excludedDataElementsRepository", "uploadExcludedDataElementsConsumer", "uploadReferralLocationsConsumer",
        "referralLocationsRepository", "downloadProjectSettingsConsumer", "downloadChartsConsumer", "downloadPivotTablesConsumer", "downloadEventReportsConsumer", "downloadModuleDataBlocksConsumer", "moduleDataBlockMerger",
        "syncModuleDataBlockConsumer", "aggregateDataValuesMerger", "lineListEventsMerger", "syncExcludedLinelistOptionsConsumer",
        "excludedLinelistOptionsMerger", "downloadHistoricalDataConsumer", "syncOrgUnitConsumer"
    ],
    function (downloadOrgUnitConsumer, uploadOrgUnitConsumer, uploadOrgUnitGroupConsumer, downloadDataSetConsumer, assignDataSetsToOrgUnitsConsumer, associateOrgunitToProgramConsumer, createUserConsumer,
        updateUserConsumer, dispatcher, consumerRegistry, orgUnitRepository, programRepository, uploadProgramConsumer,
        downloadProgramConsumer, eventService, programEventRepository, downloadMetadataConsumer,
        downloadOrgUnitGroupConsumer, downloadSystemSettingConsumer, metadataService, metadataRepository, uploadPatientOriginConsumer, mergeBy, downloadPivotTableDataConsumer,
        downloadChartDataConsumer, downloadEventReportDataConsumer, excludedDataElementsRepository, uploadExcludedDataElementsConsumer, uploadReferralLocationsConsumer, referralLocationsRepository, downloadProjectSettingsConsumer,
        downloadChartsConsumer, downloadPivotTablesConsumer, downloadEventReportsConsumer, downloadModuleDataBlocksConsumer, moduleDataBlockMerger, syncModuleDataBlockConsumer, aggregateDataValuesMerger, lineListEventsMerger, syncExcludedLinelistOptionsConsumer, excludedLinelistOptionsMerger, downloadHistoricalDataConsumer, syncOrgUnitConsumer) {

        var init = function(app) {
            app.service('mergeBy', ['$log', mergeBy]);
            app.service('aggregateDataValuesMerger', ["mergeBy", aggregateDataValuesMerger]);
            app.service('lineListEventsMerger', [lineListEventsMerger]);
            app.service('moduleDataBlockMerger', ["dataRepository", "approvalDataRepository", "dataService", "$q", "dataSetRepository", "approvalService", "dataSyncFailureRepository", "programEventRepository", "eventService", "aggregateDataValuesMerger", "lineListEventsMerger", moduleDataBlockMerger]);
            app.service('excludedLinelistOptionsMerger', ['$q', 'excludedLineListOptionsRepository', 'dataStoreService', 'orgUnitRepository', excludedLinelistOptionsMerger]);
            app.service("downloadOrgUnitConsumer", ["orgUnitService", "systemInfoService", "orgUnitRepository", "changeLogRepository", "$q", "mergeBy", "systemSettingRepository", downloadOrgUnitConsumer]);
            app.service("uploadOrgUnitConsumer", ["orgUnitService", "orgUnitRepository", "$q", uploadOrgUnitConsumer]);
            app.service("downloadOrgUnitGroupConsumer", ["orgUnitGroupService", "systemInfoService","orgUnitGroupRepository", "changeLogRepository", downloadOrgUnitGroupConsumer]);
            app.service("uploadOrgUnitGroupConsumer", ["orgUnitGroupService", "orgUnitGroupRepository", "$q", uploadOrgUnitGroupConsumer]);
            app.service("downloadDataSetConsumer", ["dataSetService", "systemInfoService", "dataSetRepository", "$q", "changeLogRepository", "mergeBy", downloadDataSetConsumer]);
            app.service("assignDataSetsToOrgUnitsConsumer", ["orgUnitService", "$q", assignDataSetsToOrgUnitsConsumer]);
            app.service("associateOrgunitToProgramConsumer", ["programService", "$q", associateOrgunitToProgramConsumer]);
            app.service("createUserConsumer", ["userService", createUserConsumer]);
            app.service("updateUserConsumer", ["userService", updateUserConsumer]);
            app.service("downloadSystemSettingConsumer", ["systemSettingService", "systemSettingRepository", "mergeBy", downloadSystemSettingConsumer]);
            app.service("downloadProjectSettingsConsumer", ["$q", "systemInfoService", "userPreferenceRepository", "referralLocationsRepository", "patientOriginRepository", "excludedDataElementsRepository", "mergeBy", "changeLogRepository", "dataStoreService", "orgUnitRepository", "excludedLineListOptionsRepository", downloadProjectSettingsConsumer]);
            app.service("consumerRegistry", ["$hustle", "$q", "$log", "dispatcher", consumerRegistry]);
            app.service("uploadProgramConsumer", ["programService", "programRepository", "$q", uploadProgramConsumer]);
            app.service("downloadProgramConsumer", ["programService", "systemInfoService", "programRepository", "changeLogRepository", "$q", "mergeBy", downloadProgramConsumer]);
            app.service("downloadMetadataConsumer", ["$q" ,"metadataService", "systemInfoService", "metadataRepository", "changeLogRepository", downloadMetadataConsumer]);
            app.service("uploadPatientOriginConsumer", ["$q", "dataStoreService", "patientOriginRepository", "orgUnitRepository", "mergeBy", uploadPatientOriginConsumer]);
            app.service("downloadPivotTablesConsumer", ["reportService", "systemInfoService", "pivotTableRepository", "changeLogRepository", downloadPivotTablesConsumer]);
            app.service("downloadPivotTableDataConsumer", ["reportService", "systemInfoService", "pivotTableRepository", "userPreferenceRepository", "dataSetRepository", "changeLogRepository", "orgUnitRepository", "programRepository", "$q", downloadPivotTableDataConsumer]);
            app.service("downloadChartsConsumer", ["reportService", "systemInfoService", "chartRepository", "changeLogRepository", downloadChartsConsumer]);
            app.service("downloadChartDataConsumer", ["reportService", "systemInfoService", "chartRepository", "userPreferenceRepository", "dataSetRepository", "changeLogRepository", "orgUnitRepository","programRepository", "$q", downloadChartDataConsumer]);
            app.service("downloadEventReportsConsumer", ["systemInfoService", "changeLogRepository", "reportService", "eventReportRepository", downloadEventReportsConsumer]);
            app.service("downloadEventReportDataConsumer", ["$q", "systemInfoService", "userPreferenceRepository", "orgUnitRepository", "programRepository", "eventReportRepository", "changeLogRepository", "reportService", downloadEventReportDataConsumer]);
            app.service("uploadReferralLocationsConsumer", ["$q", "dataStoreService", "referralLocationsRepository", "orgUnitRepository", uploadReferralLocationsConsumer]);
            app.service("uploadExcludedDataElementsConsumer", ["$q", "dataStoreService", "excludedDataElementsRepository", "orgUnitRepository", uploadExcludedDataElementsConsumer]);
            app.service("downloadModuleDataBlocksConsumer", ["dataService", "approvalService", "systemInfoService", "dataSetRepository", "userPreferenceRepository", "changeLogRepository", "orgUnitRepository",
                "moduleDataBlockFactory", "moduleDataBlockMerger", "eventService", "$q", downloadModuleDataBlocksConsumer]);
            app.service("syncModuleDataBlockConsumer", ["moduleDataBlockFactory", "dataService", "eventService", "dataSetRepository", "approvalService", "orgUnitRepository", "changeLogRepository", "moduleDataBlockMerger", "$q", syncModuleDataBlockConsumer]);
            app.service("syncExcludedLinelistOptionsConsumer", ["$q", "excludedLinelistOptionsMerger", syncExcludedLinelistOptionsConsumer]);
            app.service("downloadHistoricalDataConsumer", ["$q", "mergeBy", "dataService", "eventService", "systemInfoService", "userPreferenceRepository", "orgUnitRepository", "dataSetRepository", "changeLogRepository", "dataRepository", "programEventRepository", "lineListEventsMerger", downloadHistoricalDataConsumer]);
            app.service("syncOrgUnitConsumer", ["$q", "orgUnitService", "orgUnitRepository", syncOrgUnitConsumer]);
            app.service("dispatcher", ["$q", "$log", "downloadOrgUnitConsumer", "uploadOrgUnitConsumer", "uploadOrgUnitGroupConsumer", "downloadDataSetConsumer", "assignDataSetsToOrgUnitsConsumer",
                "createUserConsumer", "updateUserConsumer", "uploadProgramConsumer",
                "downloadProgramConsumer", "downloadMetadataConsumer",
                "downloadOrgUnitGroupConsumer", "downloadSystemSettingConsumer", "uploadPatientOriginConsumer", "downloadPivotTableDataConsumer", "downloadChartDataConsumer", "downloadEventReportDataConsumer",
                "uploadReferralLocationsConsumer", "downloadProjectSettingsConsumer", "uploadExcludedDataElementsConsumer", "downloadChartsConsumer", "downloadPivotTablesConsumer", "downloadEventReportsConsumer", "userPreferenceRepository",
                "downloadModuleDataBlocksConsumer", "syncModuleDataBlockConsumer", "associateOrgunitToProgramConsumer", "syncExcludedLinelistOptionsConsumer", "downloadHistoricalDataConsumer", "syncOrgUnitConsumer", dispatcher
            ]);

        };
        return {
            init: init
        };
    });
