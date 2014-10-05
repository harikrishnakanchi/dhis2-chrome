define(['approvalHelper', 'orgUnitRepository', 'dataSetRepository', 'approvalDataRepository', 'dataRepository'],
    function(approvalHelper, orgUnitRepository, dataSetRepository, approvalDataRepository, dataRepository) {
        var init = function(app) {
            app.service('approvalHelper', ['$hustle', '$q', '$rootScope', 'orgUnitRepository', 'dataSetRepository', 'approvalDataRepository', 'dataRepository', approvalHelper]);
        };
        return {
            init: init
        };
    });