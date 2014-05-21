define(["dashboardController", "angularMocks", "utils"], function(DashboardController, mocks, utils) {
    describe("dashboard controller", function() {
        var q, db, dataService, dashboardController, rootScope;

        beforeEach(mocks.inject(function($rootScope, $q) {
            q = $q;
            scope = $rootScope.$new();
            rootScope = $rootScope;

            dataService = {
                "downloadAllData": function() {}
            };

            dashboardController = new DashboardController(scope, q, dataService, rootScope);
        }));


        it("should fetch and display all organisation units", function() {
            spyOn(dataService, "downloadAllData").and.callFake(function() {
                return utils.getPromise(q, {});
            });

            rootScope.currentUser = {
                "firstName": "testfirst",
                "surName": "testsur",
                "userName": "testuser",
                "organisationUnits": [{
                    "id": "proj_0",
                    "name": "blah"
                }]
            };

            scope.syncNow();
            expect(scope.isSyncRunning).toEqual(true);
            expect(scope.isSyncDone).toEqual(undefined);

            scope.$apply();

            expect(scope.isSyncRunning).toEqual(false);
            expect(scope.isSyncDone).toEqual(true);
            expect(dataService.downloadAllData).toHaveBeenCalledWith("proj_0");
        });
    });
});