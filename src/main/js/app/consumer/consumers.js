define(["downloadOrgUnitConsumer", "uploadOrgUnitConsumer", "uploadOrgUnitGroupConsumer", "downloadDataSetConsumer", "assignDataSetsToOrgUnitsConsumer",
        "associateOrgunitToProgramConsumer", "createUserConsumer", "updateUserConsumer", "dispatcher", "consumerRegistry",
        "orgUnitRepository", "programRepository", "uploadProgramConsumer", "downloadProgramConsumer", "eventService", "programEventRepository",
        "downloadMetadataConsumer", "downloadOrgUnitGroupConsumer", "downloadSystemSettingConsumer", "metadataService",
        "metadataRepository", "uploadPatientOriginConsumer", "mergeBy", "downloadPivotTableDataConsumer", "downloadChartDataConsumer", "excludedDataElementsRepository", "uploadExcludedDataElementsConsumer", "uploadReferralLocationsConsumer",
        "referralLocationsRepository", "downloadProjectSettingsConsumer", "downloadChartsConsumer", "downloadPivotTablesConsumer", "downloadModuleDataBlocksConsumer", "moduleDataBlockMerger",
        "syncModuleDataBlockConsumer", "aggregateDataValuesMerger", "lineListEventsMerger", "removeOrgUnitDataSetAssociationConsumer", "syncExcludedLinelistOptionsConsumer",
        "excludedLinelistOptionsMerger", "downloadHistoricalDataConsumer", "syncOrgUnitConsumer"
    ],
    function (downloadOrgUnitConsumer, uploadOrgUnitConsumer, uploadOrgUnitGroupConsumer, downloadDataSetConsumer, assignDataSetsToOrgUnitsConsumer, associateOrgunitToProgramConsumer, createUserConsumer,
        updateUserConsumer, dispatcher, consumerRegistry, orgUnitRepository, programRepository, uploadProgramConsumer,
        downloadProgramConsumer, eventService, programEventRepository, downloadMetadataConsumer,
        downloadOrgUnitGroupConsumer, downloadSystemSettingConsumer, metadataService, metadataRepository, uploadPatientOriginConsumer, mergeBy, downloadPivotTableDataConsumer,
        downloadChartDataConsumer, excludedDataElementsRepository, uploadExcludedDataElementsConsumer, uploadReferralLocationsConsumer, referralLocationsRepository, downloadProjectSettingsConsumer,
        downloadChartsConsumer, downloadPivotTablesConsumer, downloadModuleDataBlocksConsumer, moduleDataBlockMerger, syncModuleDataBlockConsumer, aggregateDataValuesMerger, lineListEventsMerger,
        removeOrgunitDataSetAssociationConsumer, syncExcludedLinelistOptionsConsumer, excludedLinelistOptionsMerger, downloadHistoricalDataConsumer, syncOrgUnitConsumer) {

        var init = function(app) {
            app.service('mergeBy', ['$log', mergeBy]);
            app.service('aggregateDataValuesMerger', ["mergeBy", aggregateDataValuesMerger]);
            app.service('lineListEventsMerger', [lineListEventsMerger]);
            app.service('moduleDataBlockMerger', ["dataRepository", "approvalDataRepository", "dataService", "$q", "dataSetRepository", "approvalService", "dataSyncFailureRepository", "programEventRepository", "eventService", "aggregateDataValuesMerger", "lineListEventsMerger", moduleDataBlockMerger]);
            app.service('excludedLinelistOptionsMerger', ['$q', 'excludedLineListOptionsRepository', 'dataStoreService', 'orgUnitRepository', excludedLinelistOptionsMerger]);
            app.service("downloadOrgUnitConsumer", ["orgUnitService", "systemInfoService", "orgUnitRepository", "changeLogRepository", "$q", "mergeBy", downloadOrgUnitConsumer]);
            app.service("uploadOrgUnitConsumer", ["orgUnitService", "orgUnitRepository", "$q", uploadOrgUnitConsumer]);
            app.service("downloadOrgUnitGroupConsumer", ["orgUnitGroupService", "systemInfoService","orgUnitGroupRepository", "changeLogRepository", downloadOrgUnitGroupConsumer]);
            app.service("uploadOrgUnitGroupConsumer", ["orgUnitGroupService", "orgUnitGroupRepository", "$q", uploadOrgUnitGroupConsumer]);
            app.service("downloadDataSetConsumer", ["dataSetService", "systemInfoService", "dataSetRepository", "$q", "changeLogRepository", "mergeBy", downloadDataSetConsumer]);
            app.service("assignDataSetsToOrgUnitsConsumer", ["orgUnitService", "$q", assignDataSetsToOrgUnitsConsumer]);
            app.service("associateOrgunitToProgramConsumer", ["programService", "$q", associateOrgunitToProgramConsumer]);
            app.service("removeOrgunitDataSetAssociationConsumer", ["dataSetService", "$q", removeOrgunitDataSetAssociationConsumer]);
            app.service("createUserConsumer", ["userService", createUserConsumer]);
            app.service("updateUserConsumer", ["userService", updateUserConsumer]);
            app.service("downloadSystemSettingConsumer", ["systemSettingService", "systemSettingRepository", "mergeBy", downloadSystemSettingConsumer]);
            app.service("downloadProjectSettingsConsumer", ["$q", "systemSettingService", "userPreferenceRepository", "referralLocationsRepository", "patientOriginRepository", "excludedDataElementsRepository", "mergeBy", "excludedLinelistOptionsMerger", downloadProjectSettingsConsumer]);
            app.service("consumerRegistry", ["$hustle", "$q", "$log", "dispatcher", consumerRegistry]);
            app.service("uploadProgramConsumer", ["programService", "programRepository", "$q", uploadProgramConsumer]);
            app.service("downloadProgramConsumer", ["programService", "programRepository", "changeLogRepository", "$q", "mergeBy", downloadProgramConsumer]);
            app.service("downloadMetadataConsumer", ["metadataService", "systemInfoService", "metadataRepository", "changeLogRepository", downloadMetadataConsumer]);
            app.service("uploadPatientOriginConsumer", ["$q", "systemSettingService", "patientOriginRepository", "orgUnitRepository", uploadPatientOriginConsumer]);
            app.service("downloadPivotTablesConsumer", ["reportService", "systemInfoService", "pivotTableRepository", "changeLogRepository", downloadPivotTablesConsumer]);
            app.service("downloadPivotTableDataConsumer", ["reportService", "systemInfoService", "pivotTableRepository", "userPreferenceRepository", "dataSetRepository", "changeLogRepository", "orgUnitRepository", "programRepository", "$q", downloadPivotTableDataConsumer]);
            app.service("downloadChartsConsumer", ["reportService", "systemInfoService", "chartRepository", "changeLogRepository", downloadChartsConsumer]);
            app.service("downloadChartDataConsumer", ["reportService", "systemInfoService", "chartRepository", "userPreferenceRepository", "dataSetRepository", "changeLogRepository", "orgUnitRepository","programRepository", "$q", downloadChartDataConsumer]);
            app.service("uploadReferralLocationsConsumer", ["$q", "systemSettingService", "referralLocationsRepository", "orgUnitRepository", uploadReferralLocationsConsumer]);
            app.service("uploadExcludedDataElementsConsumer", ["$q", "systemSettingService", "excludedDataElementsRepository", "orgUnitRepository", uploadExcludedDataElementsConsumer]);
            app.service("downloadModuleDataBlocksConsumer", ["dataService", "approvalService", "systemInfoService", "dataSetRepository", "userPreferenceRepository", "changeLogRepository", "orgUnitRepository",
                "moduleDataBlockFactory", "moduleDataBlockMerger", "eventService", "$q", downloadModuleDataBlocksConsumer]);
            app.service("syncModuleDataBlockConsumer", ["moduleDataBlockFactory", "dataService", "eventService", "dataSetRepository", "approvalService", "orgUnitRepository", "changeLogRepository", "moduleDataBlockMerger", "$q", syncModuleDataBlockConsumer]);
            app.service("syncExcludedLinelistOptionsConsumer", ["$q", "excludedLinelistOptionsMerger", syncExcludedLinelistOptionsConsumer]);
            app.service("downloadHistoricalDataConsumer", ["$q", "dataService", "eventService", "systemInfoService", "userPreferenceRepository", "orgUnitRepository", "dataSetRepository", "changeLogRepository", "dataRepository", "programEventRepository", downloadHistoricalDataConsumer]);
            app.service("syncOrgUnitConsumer", ["$q", "orgUnitService", "orgUnitRepository", syncOrgUnitConsumer]);
            app.service("dispatcher", ["$q", "$log", "downloadOrgUnitConsumer", "uploadOrgUnitConsumer", "uploadOrgUnitGroupConsumer", "downloadDataSetConsumer", "assignDataSetsToOrgUnitsConsumer",
                "createUserConsumer", "updateUserConsumer", "uploadProgramConsumer",
                "downloadProgramConsumer", "downloadMetadataConsumer",
                "downloadOrgUnitGroupConsumer", "downloadSystemSettingConsumer", "uploadPatientOriginConsumer", "downloadPivotTableDataConsumer", "downloadChartDataConsumer",
                "uploadReferralLocationsConsumer", "downloadProjectSettingsConsumer", "uploadExcludedDataElementsConsumer", "downloadChartsConsumer", "downloadPivotTablesConsumer", "userPreferenceRepository",
                "downloadModuleDataBlocksConsumer", "syncModuleDataBlockConsumer", "removeOrgunitDataSetAssociationConsumer", "associateOrgunitToProgramConsumer", "syncExcludedLinelistOptionsConsumer", "downloadHistoricalDataConsumer", "syncOrgUnitConsumer", dispatcher
            ]);

        };
        return {
            init: init
        };
    });
