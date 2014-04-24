/*global Date:true*/
define(["moduleController", "angularMocks", "utils"], function(ModuleController, mocks, utils) {
    describe("op unit controller", function() {

        var scope, moduleController, projectsService, mockOrgStore, db, q, location, _Date;

        beforeEach(mocks.inject(function($rootScope, $q, $location) {
            scope = $rootScope.$new();
            q = $q;
            location = $location;

            projectsService = {
                "create": function() {}
            };
            mockOrgStore = {
                upsert: function() {},
                getAll: function() {}
            };
            db = {
                objectStore: function(store) {
                    return mockOrgStore;
                }
            };

            _Date = Date;
            todayStr = "2014-04-01";
            today = new Date(todayStr);
            Date = function() {
                return today;
            };

        }));

        afterEach(function() {
            Date = _Date;
        });

        it("should get all datasets", function() {
            var datasets = [{
                name: "Malaria",
                id: "dataset_1"
            }, {
                name: 'TB',
                id: 'dataset_3'
            }];

            spyOn(db, 'objectStore').and.returnValue(mockOrgStore);
            spyOn(mockOrgStore, 'getAll').and.returnValue(utils.getPromise(q, datasets));
            moduleController = new ModuleController(scope, projectsService, db, location);

            scope.$apply();

            expect(db.objectStore).toHaveBeenCalledWith("dataSets");
            expect(mockOrgStore.getAll).toHaveBeenCalled();
            expect(scope.dataSets).toEqual(datasets);
        });
    });
});