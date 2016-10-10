define(['orgUnitGroupHelper', 'sessionHelper', 'packagedDataImporter', 'originOrgunitCreator', 'pivotTableCsvBuilder'],
    function(orgUnitGroupHelper, sessionHelper, packagedDataImporter, originOrgunitCreator, pivotTableCsvBuilder) {
        var init = function(app) {
            app.service('orgUnitGroupHelper', ['$hustle', '$q', '$rootScope', 'orgUnitRepository', 'orgUnitGroupRepository', orgUnitGroupHelper]);
            app.service('sessionHelper', ['$rootScope', '$q', 'userPreferenceRepository', 'orgUnitRepository', '$hustle', sessionHelper]);
            app.service('packagedDataImporter', ['$q', 'metadataService', 'systemSettingService', 'dataSetService', 'programService', 'orgUnitService', 'changeLogRepository', 'metadataRepository', 'orgUnitRepository', 'orgUnitGroupRepository', 'dataSetRepository', 'programRepository', 'systemSettingRepository', packagedDataImporter]);
            app.service('originOrgunitCreator', ['$q', 'orgUnitRepository', 'patientOriginRepository', 'orgUnitGroupHelper', 'dataSetRepository', originOrgunitCreator]);
            app.service('pivotTableCsvBuilder', ['$rootScope', pivotTableCsvBuilder]);
        };
        return {
            init: init
        };
    });
