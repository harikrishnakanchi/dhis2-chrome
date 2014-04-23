define(["dashboardController", "angularMocks", "utils"], function(DashboardController, mocks, utils) {
    describe("dashboard controller", function() {
        var q, db, dataService, dashboardController;

        beforeEach(mocks.inject(function($rootScope, $q) {
            q = $q;
            scope = $rootScope.$new();

            dataService = {
                "get": function(orgUnit, dataset) {},
                "saveToDb": function() {}
            };

            dashboardController = new DashboardController(scope, q, dataService);
        }));


        it("should fetch and display all organisation units", function() {
            spyOn(dataService, "saveToDb");
            spyOn(dataService, "get").and.callFake(function() {
                return utils.getPromise(q, {
                    "dataValues": [{
                        "dataElement": "DE_Oedema",
                        "period": "2014W15",
                        "orgUnit": "company_0",
                        "categoryOptionCombo": "32",
                        "value": "8",
                        "storedBy": "admin",
                        "lastUpdated": "2014-04-17T15:30:56.172+05:30",
                        "followUp": false
                    }]
                });
            });

            scope.syncNow();
            expect(scope.isSyncRunning).toEqual(true);
            expect(scope.isSyncDone).toEqual(undefined);

            scope.$apply();

            expect(scope.isSyncRunning).toEqual(false);
            expect(scope.isSyncDone).toEqual(true);
            expect(dataService.get).toHaveBeenCalled();
            expect(dataService.saveToDb).toHaveBeenCalled();
        });
    });
});