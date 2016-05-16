define(["pivotTableDirective", "pivotTableController", "lockedTableHeader"], function (pivotTable, pivotTableController, lockedTableHeader) {
    var init = function (app) {
        app.directive('pivotTable', ['$filter', pivotTable]);
        app.controller('pivotTableController', ['$scope', '$rootScope', 'translationsService', pivotTableController]);
        app.directive('lockedTableHeader', ['$timeout', '$window', lockedTableHeader]);
    };
    return {
        init: init
    };
});