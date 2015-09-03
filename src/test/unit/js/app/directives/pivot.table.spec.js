define(["pivotTable", "angularMocks", "utils"], function(PivotTable, mocks, utils) {
    describe("Pivot Table Directive", function() {
        var $scope;
        beforeEach(function() {
            var app = angular.module("cc", []);
            app.directive("pivotTable", PivotTable);
            module("cc");
            module("templates/pivot.table.html");
        });
        it("should draw the correct html", mocks.inject(function($rootScope, $compile) {
            $scope = $rootScope.$new();
            var tableHtml =
                '<pivot-table data="data" definition="table"></pivot-table>';
            var htmlElement = angular.element(tableHtml);
            $compile(htmlElement)(scope);
            $scope.$digest();
            var tables = htmlElement.find("table");
            expect(tables.length).toBe(1);
        }));
    });
});
