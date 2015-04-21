define(['orgUnitGroupHelper', 'sessionHelper', 'metadataImporter', 'originOrgunitCreator'],
    function(orgUnitGroupHelper, sessionHelper, metadataImporter, originOrgunitCreator) {
        var init = function(app) {
            app.service('orgUnitGroupHelper', ['$hustle', '$q', '$rootScope', 'orgUnitRepository', 'orgUnitGroupRepository', orgUnitGroupHelper]);
            app.service('sessionHelper', ['$rootScope', sessionHelper]);
            app.service('metadataImporter', ['$q', 'metadataService', 'systemSettingService', 'systemSettingRepository', 'changeLogRepository', 'metadataRepository', 'orgUnitRepository', 'orgUnitGroupRepository', 'datasetRepository', 'programRepository', metadataImporter]);
            app.service('originOrgunitCreator', ['$q', 'orgUnitRepository', 'patientOriginRepository', 'orgUnitGroupHelper', 'datasetRepository', originOrgunitCreator]);
        };
        return {
            init: init
        };
    });
