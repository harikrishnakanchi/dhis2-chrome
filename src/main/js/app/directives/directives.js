define(["pivotTable", "pivotTableController"], function(pivotTable, pivotTableController) {
    var init = function(app) {
        app.directive('pivotTable', ['$http', pivotTable]);
        app.controller('pivotTableController', ['$scope', 'resourceBundleService', pivotTableController]);
    };
    return {
        init: init
    };
});