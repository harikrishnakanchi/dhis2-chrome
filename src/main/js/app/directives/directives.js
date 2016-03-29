define(["pivotTable", "pivotTableController", "lockedTableHeader"], function (pivotTable, pivotTableController, lockedTableHeader) {
    var init = function (app) {
        app.directive('pivotTable', ['$http', pivotTable]);
        app.controller('pivotTableController', ['$scope', '$rootScope', '$filter', pivotTableController]);
        app.directive('lockedTableHeader', ['$timeout', '$window', lockedTableHeader]);
    };
    return {
        init: init
    };
});