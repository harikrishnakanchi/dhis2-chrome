define(["dataRepository", "datasetRepository", "userPreferenceRepository", "approvalDataRepository", "orgUnitRepository", "patientOriginRepository", "programEventRepository",
        "orgUnitGroupRepository", "changeLogRepository", "programRepository", "systemSettingRepository", "metadataRepository"
    ],
    function(dataRepository, datasetRepository, userPreferenceRepository, approvalDataRepository, orgUnitRepository, patientOriginRepository,
        programEventRepository, orgUnitGroupRepository, changeLogRepository, programRepository, systemSettingRepository, metadataRepository) {
        var init = function(app) {
            app.service('dataRepository', ['$q', '$indexedDB', dataRepository]);
            app.service('datasetRepository', ['$indexedDB', '$q', datasetRepository]);
            app.service('orgUnitRepository', ['$indexedDB', '$q', orgUnitRepository]);
            app.service('userPreferenceRepository', ['$indexedDB', 'orgUnitRepository', userPreferenceRepository]);
            app.service('approvalDataRepository', ['$indexedDB', '$q', approvalDataRepository]);
            app.service('programEventRepository', ['$indexedDB', '$q', programEventRepository]);
            app.service('orgUnitGroupRepository', ['$indexedDB', orgUnitGroupRepository]);
            app.service('changeLogRepository', ['$indexedDB', changeLogRepository]);
            app.service('programRepository', ['$indexedDB', "$q", programRepository]);
            app.service('systemSettingRepository', ['$indexedDB', '$q', systemSettingRepository]);
            app.service('patientOriginRepository', ['$indexedDB', '$q', patientOriginRepository]);
            app.service('metadataRepository', ['$indexedDB', "$q", metadataRepository]);
        };
        return {
            init: init
        };
    });
