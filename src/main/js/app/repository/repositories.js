define(["dataRepository", "datasetRepository", "userPreferenceRepository", "orgUnitRepository", "systemSettingRepository", "patientOriginRepository",
        "userRepository", "approvalDataRepository", "programRepository", "programEventRepository", "dataElementRepository", "excludedDataElementsRepository",
        "orgUnitGroupRepository", "changeLogRepository", "metadataRepository", "orgUnitGroupSetRepository", "optionSetRepository", "chartRepository", "referralLocationsRepository", "pivotTableRepository"
    ],
    function(dataRepository, datasetRepository, userPreferenceRepository, orgUnitRepository, systemSettingRepository, patientOriginRepository,
        userRepository, approvalDataRepository, programRepository, programEventRepository, dataElementRepository, excludedDataElementsRepository,
        orgUnitGroupRepository, changeLogRepository, metadataRepository, orgUnitGroupSetRepository, optionSetRepository, chartRepository, referralLocationsRepository, pivotTableRepository) {
        var init = function(app) {
            app.service('dataRepository', ['$q', '$indexedDB', dataRepository]);
            app.service('approvalDataRepository', ['$indexedDB', '$q', approvalDataRepository]);
            app.service('datasetRepository', ['$indexedDB', '$q', datasetRepository]);
            app.service('systemSettingRepository', ['$indexedDB', '$q', '$rootScope', systemSettingRepository]);
            app.service('patientOriginRepository', ['$indexedDB', '$q', patientOriginRepository]);
            app.service('orgUnitRepository', ['$indexedDB', '$q', orgUnitRepository]);
            app.service('userPreferenceRepository', ['$indexedDB', "orgUnitRepository", userPreferenceRepository]);
            app.service('userRepository', ['$indexedDB', userRepository]);
            app.service('programRepository', ['$indexedDB', '$q', programRepository]);
            app.service('programEventRepository', ['$indexedDB', '$q', programEventRepository]);
            app.service('dataElementRepository', ['$indexedDB', dataElementRepository]);
            app.service('orgUnitGroupRepository', ['$indexedDB', '$q', orgUnitGroupRepository]);
            app.service('changeLogRepository', ['$indexedDB', '$q', changeLogRepository]);
            app.service('metadataRepository', ['$indexedDB', "$q", metadataRepository]);
            app.service('orgUnitGroupSetRepository', ['$indexedDB', orgUnitGroupSetRepository]);
            app.service('optionSetRepository', ['$indexedDB', 'referralLocationsRepository', optionSetRepository]);
            app.service('chartRepository', ['$indexedDB', chartRepository]);
            app.service('referralLocationsRepository', ['$indexedDB', '$q', referralLocationsRepository]);
            app.service('excludedDataElementsRepository', ['$indexedDB', '$q', excludedDataElementsRepository]);
            app.service('pivotTableRepository', ['$indexedDB', '$q', pivotTableRepository]);
        };
        return {
            init: init
        };
    });
