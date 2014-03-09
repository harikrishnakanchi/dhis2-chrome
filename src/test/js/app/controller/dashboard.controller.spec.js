define(["dashboardController", "angularMocks"], function(DashboardController, mocks) {
    describe("dashboardController", function() {
        var scope;

        beforeEach(mocks.inject(function($rootScope) {
            scope = $rootScope.$new();
        }));

        it("should set title on init", function() {
            var dashboardController = new DashboardController(scope);
            expect(scope.headline).toBe('DHIS2 Dashboard');
        });
    });
});