define(['approvalHelper', 'orgUnitGroupHelper', 'sessionHelper', 'metadataImporter'],
    function(approvalHelper, orgUnitGroupHelper, sessionHelper, metadataImporter) {
        var init = function(app) {
            app.service('approvalHelper', ['$hustle', '$q', '$rootScope', 'orgUnitRepository', 'datasetRepository', 'approvalDataRepository', 'dataRepository', approvalHelper]);
            app.service('orgUnitGroupHelper', ['$hustle', '$q', '$rootScope', 'orgUnitRepository', 'orgUnitGroupRepository', orgUnitGroupHelper]);
            app.service('sessionHelper', ['$rootScope', sessionHelper]);
            app.service('metadataImporter', ['$q', 'metadataService', 'systsemSettingService', 'changeLogRepository', 'metadataRepository', 'orgUnitRepository', 'orgUnitGroupRepository', 'datasetRepository', 'programRepository', metadataImporter]);
        };
        return {
            init: init
        };
    });
