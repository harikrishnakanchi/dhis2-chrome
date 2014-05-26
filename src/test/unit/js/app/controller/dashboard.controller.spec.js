define(["dashboardController", "dataSetRepository", "dataRepository", "dataService", "angularMocks", "utils"], function(DashboardController, DataSetRepository, DataRepository, DataService, mocks, utils) {
    describe("dashboard controller", function() {
        var q, db, dataService, dashboardController, rootScope, dataRepository, dataSetRepository;

        beforeEach(mocks.inject(function($rootScope, $q) {
            q = $q;
            scope = $rootScope.$new();
            rootScope = $rootScope;

            dataService = new DataService();
            dataRepository = new DataRepository();
            dataSetRepository = new DataSetRepository();
            dashboardController = new DashboardController(scope, q, dataSetRepository, dataRepository, dataService, rootScope);
        }));


        it("should fetch and display all organisation units", function() {
            var allDataSets = [{
                "id": "DS_OPD"
            }];
            var orgUnit = "proj_0";
            spyOn(dataSetRepository, "getAll").and.returnValue(utils.getPromise(q, allDataSets));
            spyOn(dataService, "downloadAllData").and.returnValue(utils.getPromise(q, {}));
            spyOn(dataRepository, "save");
            rootScope.currentUser = {
                "firstName": "testfirst",
                "surName": "testsur",
                "userName": "testuser",
                "organisationUnits": [{
                    "id": orgUnit,
                    "name": "blah"
                }]
            };

            scope.syncNow();

            expect(scope.isSyncRunning).toEqual(true);
            expect(scope.isSyncDone).toEqual(undefined);

            scope.$apply();

            expect(scope.isSyncRunning).toEqual(false);
            expect(scope.isSyncDone).toEqual(true);
            expect(dataService.downloadAllData).toHaveBeenCalledWith(orgUnit, allDataSets);
        });
    });
});