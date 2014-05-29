define(["dashboardController", "angularMocks", "utils"], function(DashboardController, mocks, utils) {
    describe("dashboard controller", function() {
        var q, db, hustle, dashboardController;

        beforeEach(module("hustle"));

        beforeEach(mocks.inject(function($rootScope, $q, $hustle) {
            q = $q;
            scope = $rootScope.$new();
            hustle = $hustle;

            dashboardController = new DashboardController(scope, hustle, q);
        }));


        it("should fetch and display all organisation units", function() {
            spyOn(hustle, "publish").and.returnValue(utils.getPromise(q, {}));

            scope.syncNow();

            expect(scope.isSyncRunning).toEqual(true);
            expect(scope.isSyncDone).toEqual(undefined);

            scope.$apply();

            expect(scope.isSyncRunning).toEqual(false);
            expect(scope.isSyncDone).toEqual(true);
            expect(hustle.publish).toHaveBeenCalledWith({
                "type": "downloadDataValues"
            }, "dataValues");
        });
    });
});