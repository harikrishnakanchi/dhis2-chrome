define(['approvalHelper', 'orgUnitGroupHelper', 'orgUnitRepository', 'dataSetRepository', 'approvalDataRepository', 'dataRepository', 'orgUnitGroupRepository', 'sessionHelper'],
    function(approvalHelper, orgUnitGroupHelper, orgUnitRepository, dataSetRepository, approvalDataRepository, dataRepository, orgUnitGroupRepository, sessionHelper) {
        var init = function(app) {
            app.service('approvalHelper', ['$hustle', '$q', '$rootScope', 'orgUnitRepository', 'dataSetRepository', 'approvalDataRepository', 'dataRepository', approvalHelper]);
            app.service('orgUnitGroupHelper', ['$hustle', '$q', '$rootScope', 'orgUnitRepository', 'orgUnitGroupRepository', orgUnitGroupHelper]);
            app.service('sessionHelper', ['$rootScope', sessionHelper]);
        };
        return {
            init: init
        };
    });
