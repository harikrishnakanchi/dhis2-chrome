define(['moduleDataBlockFactory'], function(moduleDataBlockFactory) {
    var init = function(app) {
        app.factory('moduleDataBlockFactory', ['$q', 'orgUnitRepository', 'dataRepository', 'programEventRepository', 'approvalDataRepository', moduleDataBlockFactory]);
    };
    return {
        init: init
    };
});