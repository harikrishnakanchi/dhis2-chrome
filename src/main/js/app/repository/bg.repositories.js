define(["dataRepository", "datasetRepository", "userPreferenceRepository", "approvalDataRepository", "orgUnitRepository", "patientOriginRepository", "programEventRepository",
        "orgUnitGroupRepository", "changeLogRepository", "programRepository", "systemSettingRepository", "metadataRepository", "chartRepository",
        "referralLocationsRepository", "pivotTableRepository", "excludedDataElementsRepository"
    ],
    function(dataRepository, datasetRepository, userPreferenceRepository, approvalDataRepository, orgUnitRepository, patientOriginRepository,
        programEventRepository, orgUnitGroupRepository, changeLogRepository, programRepository, systemSettingRepository, metadataRepository, chartRepository,
        referralLocationsRepository, pivotTableRepository, excludedDataElementsRepository) {
        var init = function(app) {
            app.service('dataRepository', ['$q', '$indexedDB', dataRepository]);
            app.service('datasetRepository', ['$indexedDB', '$q', datasetRepository]);
            app.service('orgUnitRepository', ['$indexedDB', '$q', orgUnitRepository]);
            app.service('userPreferenceRepository', ['$indexedDB', 'orgUnitRepository', userPreferenceRepository]);
            app.service('approvalDataRepository', ['$indexedDB', '$q', approvalDataRepository]);
            app.service('programEventRepository', ['$indexedDB', '$q', programEventRepository]);
            app.service('orgUnitGroupRepository', ['$indexedDB', '$q', orgUnitGroupRepository]);
            app.service('changeLogRepository', ['$indexedDB', '$q', changeLogRepository]);
            app.service('programRepository', ['$indexedDB', "$q", programRepository]);
            app.service('systemSettingRepository', ['$indexedDB', '$q', '$rootScope', systemSettingRepository]);
            app.service('patientOriginRepository', ['$indexedDB', '$q', patientOriginRepository]);
            app.service('excludedDataElementsRepository', ['$indexedDB', '$q', excludedDataElementsRepository]);
            app.service('metadataRepository', ['$indexedDB', "$q", metadataRepository]);
            app.service('chartRepository', ['$indexedDB', '$q', chartRepository]);
            app.service('referralLocationsRepository', ['$indexedDB', '$q', referralLocationsRepository]);
            app.service('pivotTableRepository', ['$indexedDB', '$q', pivotTableRepository]);
        };
        return {
            init: init
        };
    });
