define(['approvalHelper', 'orgUnitGroupHelper', 'sessionHelper', 'metadataImporter', 'originOrgunitCreator'],
    function(approvalHelper, orgUnitGroupHelper, sessionHelper, metadataImporter, originOrgunitCreator) {
        var init = function(app) {
            app.service('approvalHelper', ['$hustle', '$q', '$rootScope', 'orgUnitRepository', 'datasetRepository', 'approvalDataRepository', 'dataRepository', approvalHelper]);
            app.service('orgUnitGroupHelper', ['$hustle', '$q', '$rootScope', 'orgUnitRepository', 'orgUnitGroupRepository', orgUnitGroupHelper]);
            app.service('sessionHelper', ['$rootScope', sessionHelper]);
            app.service('metadataImporter', ['$q', 'metadataService', 'systemSettingService', 'systemSettingRepository', 'changeLogRepository', 'metadataRepository', 'orgUnitRepository', 'orgUnitGroupRepository', 'datasetRepository', 'programRepository', metadataImporter]);
            app.service('originOrgunitCreator', ['orgUnitRepository', 'patientOriginRepository', originOrgunitCreator]);
        };
        return {
            init: init
        };
    });
