define(["uploadApprovalDataConsumer", "downloadOrgUnitConsumer", "uploadOrgUnitConsumer", "uploadOrgUnitGroupConsumer", "downloadDataSetConsumer", "updateDataSetConsumer",
        "associateOrgunitToProgramConsumer", "createUserConsumer", "updateUserConsumer", "dispatcher", "consumerRegistry", "downloadDataConsumer", "uploadDataConsumer", "uploadCompletionDataConsumer",
        "orgUnitRepository", "programRepository", "uploadProgramConsumer", "downloadProgramConsumer", "deleteEventConsumer", "eventService", "programEventRepository",
        "uploadEventDataConsumer", "downloadApprovalConsumer", "downloadMetadataConsumer", "downloadOrgUnitGroupConsumer", "deleteApprovalConsumer", "downloadSystemSettingConsumer", "metadataService",
        "metadataRepository", "uploadPatientOriginConsumer", "mergeBy", "downloadPivotTableDataConsumer", "downloadChartDataConsumer", "excludedDataElementsRepository", "uploadExcludedDataElementsConsumer", "uploadReferralLocationsConsumer",
        "referralLocationsRepository", "downloadProjectSettingsConsumer", "downloadChartsConsumer", "downloadPivotTablesConsumer", "downloadModuleDataBlocksConsumer", "moduleDataBlockMerger",
        "syncModuleDataBlockConsumer", "aggregateDataValuesMerger", "lineListEventsMerger", "removeOrgUnitDataSetAssociationConsumer", "syncExcludedLinelistOptionsConsumer",
        "excludedLinelistOptionsMerger", "downloadHistoricalDataConsumer"
    ],
    function(uploadApprovalDataConsumer, downloadOrgUnitConsumer, uploadOrgUnitConsumer, uploadOrgUnitGroupConsumer, downloadDatasetConsumer, updateDatasetConsumer, associateOrgunitToProgramConsumer, createUserConsumer,
        updateUserConsumer, dispatcher, consumerRegistry, downloadDataConsumer, uploadDataConsumer, uploadCompletionDataConsumer, orgUnitRepository, programRepository, uploadProgramConsumer,
        downloadProgramConsumer, deleteEventConsumer, eventService, programEventRepository, uploadEventDataConsumer, downloadApprovalConsumer, downloadMetadataConsumer,
        downloadOrgUnitGroupConsumer, deleteApprovalConsumer, downloadSystemSettingConsumer, metadataService, metadataRepository, uploadPatientOriginConsumer, mergeBy, downloadPivotTableDataConsumer,
        downloadChartDataConsumer, excludedDataElementsRepository, uploadExcludedDataElementsConsumer, uploadReferralLocationsConsumer, referralLocationsRepository, downloadProjectSettingsConsumer,
        downloadChartsConsumer, downloadPivotTablesConsumer, downloadModuleDataBlocksConsumer, moduleDataBlockMerger, syncModuleDataBlockConsumer, aggregateDataValuesMerger, lineListEventsMerger,
        removeOrgunitDatasetAssociationConsumer, syncExcludedLinelistOptionsConsumer, excludedLinelistOptionsMerger, downloadHistoricalDataConsumer) {

        var init = function(app) {
            app.service('mergeBy', ['$log', mergeBy]);
            app.service('aggregateDataValuesMerger', ["mergeBy", aggregateDataValuesMerger]);
            app.service('lineListEventsMerger', [lineListEventsMerger]);
            app.service('moduleDataBlockMerger', ["dataRepository", "approvalDataRepository", "dataService", "$q", "dataSetRepository", "approvalService", "dataSyncFailureRepository", "programEventRepository", "eventService", "aggregateDataValuesMerger", "lineListEventsMerger", moduleDataBlockMerger]);
            app.service('excludedLinelistOptionsMerger', ['$q', 'excludedLineListOptionsRepository', 'dataStoreService', 'orgUnitRepository', excludedLinelistOptionsMerger]);
            app.service("downloadDataConsumer", ["dataService", "dataRepository", "dataSetRepository", "userPreferenceRepository", "$q", "approvalDataRepository", "mergeBy", "changeLogRepository", downloadDataConsumer]);
            app.service("downloadApprovalConsumer", ["dataSetRepository", "userPreferenceRepository", "orgUnitRepository", "$q", "approvalService", "approvalDataRepository", downloadApprovalConsumer]);
            app.service("uploadDataConsumer", ["dataService", "dataRepository", uploadDataConsumer]);
            app.service("uploadCompletionDataConsumer", ["approvalService", "approvalDataRepository", "dataSetRepository", "$q", uploadCompletionDataConsumer]);
            app.service("uploadApprovalDataConsumer", ["approvalService", "approvalDataRepository", "dataSetRepository", "$q", uploadApprovalDataConsumer]);
            app.service("downloadOrgUnitConsumer", ["orgUnitService", "orgUnitRepository", "changeLogRepository", "$q", "mergeBy", downloadOrgUnitConsumer]);
            app.service("uploadOrgUnitConsumer", ["orgUnitService", "orgUnitRepository", "$q", uploadOrgUnitConsumer]);
            app.service("downloadOrgUnitGroupConsumer", ["orgUnitGroupService", "orgUnitGroupRepository", "changeLogRepository", downloadOrgUnitGroupConsumer]);
            app.service("uploadOrgUnitGroupConsumer", ["orgUnitGroupService", "orgUnitGroupRepository", "$q", uploadOrgUnitGroupConsumer]);
            app.service("downloadDataSetConsumer", ["dataSetService", "dataSetRepository", "$q", "changeLogRepository", "mergeBy", downloadDatasetConsumer]);
            app.service("updateDataSetConsumer", ["dataSetService", "$q", updateDatasetConsumer]);
            app.service("associateOrgunitToProgramConsumer", ["programService", "$q", associateOrgunitToProgramConsumer]);
            app.service("removeOrgunitDataSetAssociationConsumer", ["dataSetService", "$q", removeOrgunitDatasetAssociationConsumer]);
            app.service("createUserConsumer", ["userService", createUserConsumer]);
            app.service("updateUserConsumer", ["userService", updateUserConsumer]);
            app.service("downloadSystemSettingConsumer", ["systemSettingService", "systemSettingRepository", "mergeBy", downloadSystemSettingConsumer]);
            app.service("downloadProjectSettingsConsumer", ["$q", "systemSettingService", "userPreferenceRepository", "referralLocationsRepository", "patientOriginRepository", "excludedDataElementsRepository", "mergeBy", "excludedLinelistOptionsMerger", downloadProjectSettingsConsumer]);
            app.service("consumerRegistry", ["$hustle", "$q", "$log", "dispatcher", consumerRegistry]);
            app.service("uploadProgramConsumer", ["programService", "programRepository", "$q", uploadProgramConsumer]);
            app.service("downloadProgramConsumer", ["programService", "programRepository", "changeLogRepository", "$q", "mergeBy", downloadProgramConsumer]);
            app.service("uploadEventDataConsumer", ["eventService", "programEventRepository", "$q", uploadEventDataConsumer]);
            app.service("deleteEventConsumer", ["eventService", "programEventRepository", "$q", deleteEventConsumer]);
            app.service("downloadMetadataConsumer", ["metadataService", "metadataRepository", "changeLogRepository", downloadMetadataConsumer]);
            app.service("deleteApprovalConsumer", ["approvalService", "approvalDataRepository", "dataSetRepository", "$q", deleteApprovalConsumer]);
            app.service("uploadPatientOriginConsumer", ["$q", "systemSettingService", "patientOriginRepository", "orgUnitRepository", uploadPatientOriginConsumer]);
            app.service("downloadPivotTablesConsumer", ["reportService", "pivotTableRepository", "changeLogRepository", downloadPivotTablesConsumer]);
            app.service("downloadPivotTableDataConsumer", ["reportService", "pivotTableRepository", "userPreferenceRepository", "dataSetRepository", "changeLogRepository", "orgUnitRepository", "$q", downloadPivotTableDataConsumer]);
            app.service("downloadChartsConsumer", ["reportService", "chartRepository", "changeLogRepository", downloadChartsConsumer]);
            app.service("downloadChartDataConsumer", ["reportService", "chartRepository", "userPreferenceRepository", "dataSetRepository", "changeLogRepository", "orgUnitRepository", "$q", downloadChartDataConsumer]);
            app.service("uploadReferralLocationsConsumer", ["$q", "systemSettingService", "referralLocationsRepository", "orgUnitRepository", uploadReferralLocationsConsumer]);
            app.service("uploadExcludedDataElementsConsumer", ["$q", "systemSettingService", "excludedDataElementsRepository", "orgUnitRepository", uploadExcludedDataElementsConsumer]);
            app.service("downloadModuleDataBlocksConsumer", ["dataService", "approvalService", "dataSetRepository", "userPreferenceRepository", "changeLogRepository", "orgUnitRepository",
                "moduleDataBlockFactory", "moduleDataBlockMerger", "eventService", "$q", downloadModuleDataBlocksConsumer]);
            app.service("syncModuleDataBlockConsumer", ["moduleDataBlockFactory", "dataService", "eventService", "dataSetRepository", "approvalService", "orgUnitRepository", "changeLogRepository", "moduleDataBlockMerger", "$q", syncModuleDataBlockConsumer]);
            app.service("syncExcludedLinelistOptionsConsumer", ["$q", "excludedLinelistOptionsMerger", syncExcludedLinelistOptionsConsumer]);
            app.service("downloadHistoricalDataConsumer", ["$q", "dataService", "eventService", "userPreferenceRepository", "orgUnitRepository", "dataSetRepository", "changeLogRepository", "dataRepository", "programEventRepository", downloadHistoricalDataConsumer]);
            app.service("dispatcher", ["$q", "$log", "downloadOrgUnitConsumer", "uploadOrgUnitConsumer", "uploadOrgUnitGroupConsumer", "downloadDataSetConsumer", "updateDataSetConsumer",
                "createUserConsumer", "updateUserConsumer", "downloadDataConsumer", "uploadDataConsumer", "uploadCompletionDataConsumer", "uploadApprovalDataConsumer", "uploadProgramConsumer",
                "downloadProgramConsumer", "uploadEventDataConsumer", "deleteEventConsumer", "downloadApprovalConsumer", "downloadMetadataConsumer",
                "downloadOrgUnitGroupConsumer", "deleteApprovalConsumer", "downloadSystemSettingConsumer", "uploadPatientOriginConsumer", "downloadPivotTableDataConsumer", "downloadChartDataConsumer",
                "uploadReferralLocationsConsumer", "downloadProjectSettingsConsumer", "uploadExcludedDataElementsConsumer", "downloadChartsConsumer", "downloadPivotTablesConsumer", "userPreferenceRepository",
                "downloadModuleDataBlocksConsumer", "syncModuleDataBlockConsumer", "removeOrgunitDataSetAssociationConsumer", "associateOrgunitToProgramConsumer", "syncExcludedLinelistOptionsConsumer", "downloadHistoricalDataConsumer", dispatcher
            ]);

        };
        return {
            init: init
        };
    });
