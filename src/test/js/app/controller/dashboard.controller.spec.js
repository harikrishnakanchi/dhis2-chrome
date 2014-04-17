define(["dashboardController", "angularMocks", "utils"], function(DashboardController, mocks, utils) {
    describe("dashboard controller", function() {
        var q, db, dataService, dashboardController;

        beforeEach(mocks.inject(function($rootScope, $q) {
            q = $q;
            scope = $rootScope.$new();

            dataService = {
                "fetch": function(orgUnit, dataset) {},
                "parseAndSave": function() {}
            };

            dashboardController = new DashboardController(scope, q, dataService);

        }));


        it("should fetch and display all organisation units", function() {
            spyOn(dataService, "parseAndSave");
            spyOn(dataService, "fetch").and.callFake(function() {
                return utils.getPromise(q, {
                    dataValues: [{
                        dataElement: "DE_Oedema",
                        period: "2014W15",
                        orgUnit: "company_0",
                        categoryOptionCombo: "32",
                        value: "8",
                        storedBy: "admin",
                        lastUpdated: "2014-04-17T15:30:56.172+05:30",
                        followUp: false
                    }]
                });
            });

            scope.$apply();
            scope.syncNow();

            expect(dataService.fetch.calls.count()).toBe(5);
            scope.$digest();
            expect(scope.message).toEqual("Sync success");
            expect(dataService.parseAndSave).toHaveBeenCalled();
        });

    });
});