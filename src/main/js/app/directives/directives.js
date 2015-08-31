define(["pivotTable"], function(pivotTable) {
    var init = function(app) {
        app.directive('pivotTable', ['$http', pivotTable]);
    };
    return {
        init: init
    };
});