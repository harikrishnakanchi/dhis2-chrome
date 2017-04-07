define(['orgUnitGroupHelper', 'sessionHelper', 'packagedDataImporter', 'originOrgunitCreator', 'pivotTableExportBuilder', 'metadataHelper'],
    function(orgUnitGroupHelper, sessionHelper, packagedDataImporter, originOrgunitCreator, pivotTableExportBuilder, metadataHelper) {
        var init = function(app) {
            app.service('orgUnitGroupHelper', ['$hustle', '$q', '$rootScope', 'orgUnitRepository', 'orgUnitGroupRepository', orgUnitGroupHelper]);
            app.service('sessionHelper', ['$rootScope', '$q', 'userPreferenceRepository', 'orgUnitRepository', '$location', 'storageService', sessionHelper]);
            app.service('packagedDataImporter', ['$q', 'metadataService', 'systemSettingService', 'dataSetService', 'programService', 'orgUnitService', 'changeLogRepository', 'metadataRepository', 'orgUnitRepository', 'orgUnitGroupRepository', 'dataSetRepository', 'programRepository', 'systemSettingRepository', packagedDataImporter]);
            app.service('originOrgunitCreator', ['$q', 'orgUnitRepository', 'patientOriginRepository', 'orgUnitGroupHelper', 'dataSetRepository', originOrgunitCreator]);
            app.service('pivotTableExportBuilder', ['$rootScope', pivotTableExportBuilder]);
            app.service('metadataHelper', ['$q', 'changeLogRepository', metadataHelper]);
        };
        return {
            init: init
        };
    });
