define(['moduleDataBlockFactory'], function(moduleDataBlockFactory) {
    var init = function(app) {
        app.factory('moduleDataBlockFactory', ['$q', 'orgUnitRepository', 'dataRepository', moduleDataBlockFactory]);
    };
    return {
        init: init
    };
});