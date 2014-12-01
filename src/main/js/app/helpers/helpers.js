define(['approvalHelper', 'orgUnitGroupHelper', 'orgUnitRepository', 'dataSetRepository', 'approvalDataRepository', 'dataRepository', 'orgUnitGroupRepository'],
    function(approvalHelper, orgUnitGroupHelper, orgUnitRepository, dataSetRepository, approvalDataRepository, dataRepository, orgUnitGroupRepository) {
        var init = function(app) {
            app.service('approvalHelper', ['$hustle', '$q', '$rootScope', 'orgUnitRepository', 'dataSetRepository', 'approvalDataRepository', 'dataRepository', approvalHelper]);
            app.service('orgUnitGroupHelper', ['$hustle','$q', '$rootScope', 'orgUnitRepository', 'orgUnitGroupRepository', orgUnitGroupHelper]);
        };
        return {
            init: init
        };
    });