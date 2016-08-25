define(["dataRepository", "datasetRepository", "userPreferenceRepository", "approvalDataRepository", "orgUnitRepository", "patientOriginRepository", "programEventRepository",
        "orgUnitGroupRepository", "changeLogRepository", "programRepository", "systemSettingRepository", "metadataRepository", "chartRepository",
        "referralLocationsRepository", "pivotTableRepository", "excludedDataElementsRepository", "dataSyncFailureRepository", "dataElementRepository", "excludedLineListOptionsRepository"
    ],
    function(dataRepository, datasetRepository, userPreferenceRepository, approvalDataRepository, orgUnitRepository, patientOriginRepository,
        programEventRepository, orgUnitGroupRepository, changeLogRepository, programRepository, systemSettingRepository, metadataRepository, chartRepository,
        referralLocationsRepository, pivotTableRepository, excludedDataElementsRepository, dataSyncFailureRepository, dataElementRepository, excludedLineListOptionsRepository) {
        var init = function(app) {
            app.service('dataRepository', ['$q', '$indexedDB', dataRepository]);
            app.service('datasetRepository', ['$indexedDB', '$q', datasetRepository]);
            app.service('orgUnitRepository', ['$indexedDB', '$q', orgUnitRepository]);
            app.service('userPreferenceRepository', ['$indexedDB', 'orgUnitRepository', userPreferenceRepository]);
            app.service('approvalDataRepository', ['$indexedDB', '$q', approvalDataRepository]);
            app.service('dataElementRepository', ['$indexedDB', dataElementRepository]);
            app.service('programEventRepository', ['$indexedDB', '$q', 'dataElementRepository', programEventRepository]);
            app.service('orgUnitGroupRepository', ['$indexedDB', '$q', orgUnitGroupRepository]);
            app.service('changeLogRepository', ['$indexedDB', '$q', changeLogRepository]);
            app.service('programRepository', ['$indexedDB', "$q", 'dataElementRepository', programRepository]);
            app.service('systemSettingRepository', ['$indexedDB', '$q', '$rootScope', systemSettingRepository]);
            app.service('patientOriginRepository', ['$indexedDB', '$q', patientOriginRepository]);
            app.service('excludedDataElementsRepository', ['$indexedDB', '$q', excludedDataElementsRepository]);
            app.service('metadataRepository', ['$indexedDB', "$q", metadataRepository]);
            app.service('chartRepository', ['$indexedDB', '$q', chartRepository]);
            app.service('referralLocationsRepository', ['$indexedDB', '$q', 'datasetRepository', referralLocationsRepository]);
            app.service('pivotTableRepository', ['$indexedDB', '$q', pivotTableRepository]);
            app.service('dataSyncFailureRepository', ['$indexedDB', dataSyncFailureRepository]);
            app.service('excludedLineListOptionsRepository', ['$indexedDB', excludedLineListOptionsRepository]);
        };
        return {
            init: init
        };
    });
