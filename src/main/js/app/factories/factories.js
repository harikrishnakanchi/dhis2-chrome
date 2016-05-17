define(['moduleDataBlockFactory', 'checkVersionCompatibility'], function(moduleDataBlockFactory, checkVersionCompatibility) {
    var init = function(app) {
        app.factory('moduleDataBlockFactory', ['$q', 'orgUnitRepository', 'dataRepository', 'programEventRepository', 'approvalDataRepository', moduleDataBlockFactory]);
        app.factory('checkVersionCompatibility', ['systemSettingRepository', checkVersionCompatibility]);
    };
    return {
        init: init
    };
});