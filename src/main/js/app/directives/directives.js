define(["pivotTableDirective", "pivotTableController", "lockedTableHeader", "descriptionPopup"], function (pivotTable, pivotTableController, lockedTableHeader, descriptionPopup) {
    var init = function (app) {
        app.directive('pivotTable', [pivotTable]);
        app.controller('pivotTableController', ['$scope', '$rootScope', 'translationsService', 'filesystemService', 'pivotTableCsvBuilder', pivotTableController]);
        app.directive('lockedTableHeader', ['$timeout', '$window', lockedTableHeader]);
        app.directive('descriptionPopup', ['$modal', '$rootScope', descriptionPopup]);
    };
    return {
        init: init
    };
});