define(["dataRepository", "datasetRepository", "userPreferenceRepository", "orgUnitRepository", "systemSettingRepository", "patientOriginRepository",
        "userRepository", "approvalDataRepository", "programRepository", "programEventRepository", "dataElementRepository",
        "orgUnitGroupRepository", "changeLogRepository", "indicatorRepository", "metadataRepository"
    ],
    function(dataRepository, datasetRepository, userPreferenceRepository, orgUnitRepository, systemSettingRepository, patientOriginRepository,
        userRepository, approvalDataRepository, programRepository, programEventRepository, dataElementRepository,
        orgUnitGroupRepository, changeLogRepository, indicatorRepository, metadataRepository) {
        var init = function(app) {
            app.service('dataRepository', ['$indexedDB', dataRepository]);
            app.service('approvalDataRepository', ['$indexedDB', approvalDataRepository]);
            app.service('datasetRepository', ['$indexedDB', '$q', datasetRepository]);
            app.service('systemSettingRepository', ['$indexedDB', '$q', systemSettingRepository]);
            app.service('patientOriginRepository', ['$indexedDB', '$q', patientOriginRepository]);
            app.service('orgUnitRepository', ['$indexedDB', 'datasetRepository', 'programRepository', '$q', orgUnitRepository]);
            app.service('userPreferenceRepository', ['$indexedDB', "orgUnitRepository", userPreferenceRepository]);
            app.service('userRepository', ['$indexedDB', userRepository]);
            app.service('programRepository', ['$indexedDB', '$q', programRepository]);
            app.service('programEventRepository', ['$indexedDB', '$q', programEventRepository]);
            app.service('dataElementRepository', ['$indexedDB', dataElementRepository]);
            app.service('orgUnitGroupRepository', ['$indexedDB', orgUnitGroupRepository]);
            app.service('changeLogRepository', ['$indexedDB', changeLogRepository]);
            app.service('indicatorRepository', ['$indexedDB', indicatorRepository]);
            app.service('metadataRepository', ['$indexedDB', "$q", metadataRepository]);
        };
        return {
            init: init
        };
    });
