define(["dashboardController", "dataValuesService", "angularMocks", "utils"], function(DashboardController, DataValuesService, mocks, utils) {
    describe("dashboard controller", function() {
        var q, db, dataValuesService, dashboardController;

        beforeEach(mocks.inject(function($rootScope, $q) {
            q = $q;
            scope = $rootScope.$new();

            dataValuesService = new DataValuesService();
            dashboardController = new DashboardController(scope, dataValuesService);
        }));


        it("should fetch and display all organisation units", function() {
            spyOn(dataValuesService, "sync").and.returnValue(utils.getPromise(q, {}));

            scope.syncNow();

            expect(scope.isSyncRunning).toEqual(true);
            expect(scope.isSyncDone).toEqual(undefined);

            scope.$apply();

            expect(scope.isSyncRunning).toEqual(false);
            expect(scope.isSyncDone).toEqual(true);
            expect(dataValuesService.sync).toHaveBeenCalled();
        });
    });
});