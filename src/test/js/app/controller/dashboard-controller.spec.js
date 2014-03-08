define(["dashboardController"], function(DashboardController) {
    describe("dashboardController", function() {
        it("should set title on init", function() {
            var $scope = {};
            var dashboardController = new DashboardController($scope);
            expect($scope.headline).toBe('DHIS2 Dashboard');
        });
    });
});