define(['orgUnitGroupHelper', 'sessionHelper', 'packagedDataImporter', 'originOrgunitCreator', 'pivotTableExportBuilder'],
    function(orgUnitGroupHelper, sessionHelper, packagedDataImporter, originOrgunitCreator, pivotTableExportBuilder) {
        var init = function(app) {
            app.service('orgUnitGroupHelper', ['$hustle', '$q', '$rootScope', 'orgUnitRepository', 'orgUnitGroupRepository', orgUnitGroupHelper]);
            app.service('sessionHelper', ['$rootScope', '$q', 'userPreferenceRepository', 'orgUnitRepository', '$hustle', sessionHelper]);
            app.service('packagedDataImporter', ['$q', 'metadataService', 'systemSettingService', 'datasetService', 'programService', 'changeLogRepository', 'metadataRepository', 'orgUnitRepository', 'orgUnitGroupRepository', 'datasetRepository', 'programRepository', 'systemSettingRepository', packagedDataImporter]);
            app.service('originOrgunitCreator', ['$q', 'orgUnitRepository', 'patientOriginRepository', 'orgUnitGroupHelper', 'datasetRepository', originOrgunitCreator]);
            app.service('pivotTableExportBuilder', ['$rootScope', pivotTableExportBuilder]);
        };
        return {
            init: init
        };
    });
