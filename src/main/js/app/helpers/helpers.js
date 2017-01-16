define(['orgUnitGroupHelper', 'sessionHelper', 'packagedDataImporter', 'originOrgunitCreator', 'pivotTableExportBuilder'],
    function(orgUnitGroupHelper, sessionHelper, packagedDataImporter, originOrgunitCreator, pivotTableExportBuilder) {
        var init = function(app) {
            app.service('orgUnitGroupHelper', ['$hustle', '$q', '$rootScope', 'orgUnitRepository', 'orgUnitGroupRepository', orgUnitGroupHelper]);
            app.service('sessionHelper', ['$rootScope', '$q', 'userPreferenceRepository', 'orgUnitRepository', '$location', 'storageService', sessionHelper]);
            app.service('packagedDataImporter', ['$q', 'metadataService', 'systemSettingService', 'dataSetService', 'programService', 'orgUnitService', 'changeLogRepository', 'metadataRepository', 'orgUnitRepository', 'orgUnitGroupRepository', 'dataSetRepository', 'programRepository', 'systemSettingRepository', packagedDataImporter]);
            app.service('originOrgunitCreator', ['$q', 'orgUnitRepository', 'patientOriginRepository', 'orgUnitGroupHelper', 'dataSetRepository', originOrgunitCreator]);
            app.service('pivotTableExportBuilder', ['$rootScope', pivotTableExportBuilder]);
        };
        return {
            init: init
        };
    });
