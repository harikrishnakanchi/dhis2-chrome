define(["uploadApprovalDataConsumer", "downloadOrgUnitConsumer", "uploadOrgUnitConsumer", "uploadOrgUnitGroupConsumer", "downloadDatasetConsumer", "updateDatasetConsumer",
        "createUserConsumer", "updateUserConsumer", "dispatcher", "consumerRegistry", "downloadDataConsumer", "uploadDataConsumer", "uploadCompletionDataConsumer",
        "orgUnitRepository", "programRepository", "uploadProgramConsumer", "downloadProgramConsumer", "deleteEventConsumer", "eventService", "programEventRepository",
        "uploadEventDataConsumer", "downloadApprovalConsumer", "downloadMetadataConsumer", "downloadOrgUnitGroupConsumer", "deleteApprovalConsumer", "downloadSystemSettingConsumer", "metadataService",
        "metadataRepository", "uploadPatientOriginConsumer", "mergeBy", "downloadPivotTableDataConsumer", "downloadChartDataConsumer", "excludedDataElementsRepository", "uploadExcludedDataElementsConsumer", "uploadReferralLocationsConsumer",
        "referralLocationsRepository", "downloadProjectSettingsConsumer", "downloadChartsConsumer", "downloadPivotTablesConsumer", "downloadModuleDataBlocksConsumer", "moduleDataBlockMerger",
        "syncModuleDataBlockConsumer", "aggregateDataValuesMerger", "lineListEventsMerger"
    ],
    function(uploadApprovalDataConsumer, downloadOrgUnitConsumer, uploadOrgUnitConsumer, uploadOrgUnitGroupConsumer, downloadDatasetConsumer, updateDatasetConsumer, createUserConsumer,
        updateUserConsumer, dispatcher, consumerRegistry, downloadDataConsumer, uploadDataConsumer, uploadCompletionDataConsumer, orgUnitRepository, programRepository, uploadProgramConsumer,
        downloadProgramConsumer, deleteEventConsumer, eventService, programEventRepository, uploadEventDataConsumer, downloadApprovalConsumer, downloadMetadataConsumer,
        downloadOrgUnitGroupConsumer, deleteApprovalConsumer, downloadSystemSettingConsumer, metadataService, metadataRepository, uploadPatientOriginConsumer, mergeBy, downloadPivotTableDataConsumer,
        downloadChartDataConsumer, excludedDataElementsRepository, uploadExcludedDataElementsConsumer, uploadReferralLocationsConsumer, referralLocationsRepository, downloadProjectSettingsConsumer,
        downloadChartsConsumer, downloadPivotTablesConsumer, downloadModuleDataBlocksConsumer, moduleDataBlockMerger, syncModuleDataBlockConsumer, aggregateDataValuesMerger, lineListEventsMerger) {

        var init = function(app) {
            app.service('mergeBy', ['$log', mergeBy]);
            app.service('aggregateDataValuesMerger', ["mergeBy", aggregateDataValuesMerger]);
            app.service('lineListEventsMerger', [lineListEventsMerger]);
            app.service('moduleDataBlockMerger', ["dataRepository", "approvalDataRepository", "mergeBy", "dataService", "$q", "datasetRepository", "approvalService", "dataSyncFailureRepository", "programEventRepository", "eventService", "aggregateDataValuesMerger", "lineListEventsMerger", moduleDataBlockMerger]);
            app.service("downloadDataConsumer", ["dataService", "dataRepository", "datasetRepository", "userPreferenceRepository", "$q", "approvalDataRepository", "mergeBy", "changeLogRepository", downloadDataConsumer]);
            app.service("downloadApprovalConsumer", ["datasetRepository", "userPreferenceRepository", "orgUnitRepository", "$q", "approvalService", "approvalDataRepository", downloadApprovalConsumer]);
            app.service("uploadDataConsumer", ["dataService", "dataRepository", uploadDataConsumer]);
            app.service("uploadCompletionDataConsumer", ["approvalService", "approvalDataRepository", "datasetRepository", "$q", uploadCompletionDataConsumer]);
            app.service("uploadApprovalDataConsumer", ["approvalService", "approvalDataRepository", "datasetRepository", "$q", uploadApprovalDataConsumer]);
            app.service("downloadOrgUnitConsumer", ["orgUnitService", "orgUnitRepository", "changeLogRepository", "$q", "mergeBy", downloadOrgUnitConsumer]);
            app.service("uploadOrgUnitConsumer", ["orgUnitService", "orgUnitRepository", "$q", uploadOrgUnitConsumer]);
            app.service("downloadOrgUnitGroupConsumer", ["orgUnitGroupService", "orgUnitGroupRepository", "changeLogRepository", downloadOrgUnitGroupConsumer]);
            app.service("uploadOrgUnitGroupConsumer", ["orgUnitGroupService", "orgUnitGroupRepository", "$q", uploadOrgUnitGroupConsumer]);
            app.service("downloadDatasetConsumer", ["datasetService", "datasetRepository", "$q", "changeLogRepository", "mergeBy", downloadDatasetConsumer]);
            app.service("updateDatasetConsumer", ["datasetService", "$q", updateDatasetConsumer]);
            app.service("createUserConsumer", ["userService", createUserConsumer]);
            app.service("updateUserConsumer", ["userService", updateUserConsumer]);
            app.service("downloadSystemSettingConsumer", ["systemSettingService", "systemSettingRepository", "mergeBy", downloadSystemSettingConsumer]);
            app.service("downloadProjectSettingsConsumer", ["$q", "systemSettingService", "userPreferenceRepository", "referralLocationsRepository", "patientOriginRepository", "excludedDataElementsRepository", "mergeBy", downloadProjectSettingsConsumer]);
            app.service("consumerRegistry", ["$hustle", "$q", "$log", "dispatcher", consumerRegistry]);
            app.service("uploadProgramConsumer", ["programService", "programRepository", "$q", uploadProgramConsumer]);
            app.service("downloadProgramConsumer", ["programService", "programRepository", "changeLogRepository", "$q", "mergeBy", downloadProgramConsumer]);
            app.service("uploadEventDataConsumer", ["eventService", "programEventRepository", "$q", uploadEventDataConsumer]);
            app.service("deleteEventConsumer", ["eventService", "programEventRepository", "$q", deleteEventConsumer]);
            app.service("downloadMetadataConsumer", ["metadataService", "metadataRepository", "changeLogRepository", downloadMetadataConsumer]);
            app.service("deleteApprovalConsumer", ["approvalService", "approvalDataRepository", "datasetRepository", "$q", deleteApprovalConsumer]);
            app.service("uploadPatientOriginConsumer", ["$q", "systemSettingService", "patientOriginRepository", "orgUnitRepository", uploadPatientOriginConsumer]);
            app.service("downloadPivotTablesConsumer", ["reportService", "pivotTableRepository", "changeLogRepository", downloadPivotTablesConsumer]);
            app.service("downloadPivotTableDataConsumer", ["reportService", "pivotTableRepository", "userPreferenceRepository", "datasetRepository", "changeLogRepository", "orgUnitRepository", "$q", downloadPivotTableDataConsumer]);
            app.service("downloadChartsConsumer", ["reportService", "chartRepository", "changeLogRepository", downloadChartsConsumer]);
            app.service("downloadChartDataConsumer", ["reportService", "chartRepository", "userPreferenceRepository", "datasetRepository", "changeLogRepository", "orgUnitRepository", "$q", downloadChartDataConsumer]);
            app.service("uploadReferralLocationsConsumer", ["$q", "systemSettingService", "referralLocationsRepository", "orgUnitRepository", uploadReferralLocationsConsumer]);
            app.service("uploadExcludedDataElementsConsumer", ["$q", "systemSettingService", "excludedDataElementsRepository", "orgUnitRepository", uploadExcludedDataElementsConsumer]);
            app.service("downloadModuleDataBlocksConsumer", ["dataService", "approvalService", "datasetRepository", "userPreferenceRepository", "changeLogRepository", "orgUnitRepository",
                "moduleDataBlockFactory", "moduleDataBlockMerger", "eventService", "$q", downloadModuleDataBlocksConsumer]);
            app.service("syncModuleDataBlockConsumer", ["moduleDataBlockFactory", "dataService", "datasetRepository", "approvalService", "orgUnitRepository", "moduleDataBlockMerger", syncModuleDataBlockConsumer]);
            app.service("dispatcher", ["$q", "$log", "downloadOrgUnitConsumer", "uploadOrgUnitConsumer", "uploadOrgUnitGroupConsumer", "downloadDatasetConsumer", "updateDatasetConsumer",
                "createUserConsumer", "updateUserConsumer", "downloadDataConsumer", "uploadDataConsumer", "uploadCompletionDataConsumer", "uploadApprovalDataConsumer", "uploadProgramConsumer",
                "downloadProgramConsumer", "uploadEventDataConsumer", "deleteEventConsumer", "downloadApprovalConsumer", "downloadMetadataConsumer",
                "downloadOrgUnitGroupConsumer", "deleteApprovalConsumer", "downloadSystemSettingConsumer", "uploadPatientOriginConsumer", "downloadPivotTableDataConsumer", "downloadChartDataConsumer",
                "uploadReferralLocationsConsumer", "downloadProjectSettingsConsumer", "uploadExcludedDataElementsConsumer", "downloadChartsConsumer", "downloadPivotTablesConsumer", "userPreferenceRepository", "downloadModuleDataBlocksConsumer", "syncModuleDataBlockConsumer", dispatcher
            ]);

        };
        return {
            init: init
        };
    });
