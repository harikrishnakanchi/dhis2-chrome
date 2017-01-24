define(['moduleDataBlockFactory', 'checkVersionCompatibility', 'initializationRoutine'], function(moduleDataBlockFactory, checkVersionCompatibility, initializationRoutine) {
    var init = function(app) {
        app.factory('moduleDataBlockFactory', ['$q', 'orgUnitRepository', 'dataRepository', 'programEventRepository', 'approvalDataRepository','dataSyncFailureRepository', moduleDataBlockFactory]);
        app.factory('checkVersionCompatibility', ['systemSettingRepository', checkVersionCompatibility]);
        app.factory('initializationRoutine', ['$rootScope', '$location', 'systemSettingRepository', 'translationsService', initializationRoutine]);
    };
    return {
        init: init
    };
});