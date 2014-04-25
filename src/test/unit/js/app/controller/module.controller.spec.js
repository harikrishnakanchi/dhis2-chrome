/*global Date:true*/
define(["moduleController", "angularMocks", "utils"], function(ModuleController, mocks, utils) {
    describe("op unit controller", function() {

        var scope, moduleController, projectsService, mockOrgStore, db, q, location, _Date, datasets;

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

            datasets = [{
                name: "Malaria",
                id: "dataset_1"
            }, {
                name: 'TB',
                id: 'dataset_3'
            }];

            spyOn(db, 'objectStore').and.returnValue(mockOrgStore);
            spyOn(mockOrgStore, 'getAll').and.returnValue(utils.getPromise(q, datasets));
            moduleController = new ModuleController(scope, projectsService, db, location);

        }));

        afterEach(function() {
            Date = _Date;
        });

        it("should get all datasets", function() {
            scope.$apply();

            expect(db.objectStore).toHaveBeenCalledWith("dataSets");
            expect(mockOrgStore.getAll).toHaveBeenCalled();
            expect(scope.dataSets).toEqual(datasets);
        });

        it('should delete module', function() {
            scope.modules = [{
                'name': 'Module1'
            }, {
                'name': 'Module2'
            }, {
                'name': 'Module1'
            }, {
                'name': 'Module4'
            }];
            scope.$apply();

            scope.delete(2);
            expect(scope.modules).toEqual([{
                'name': 'Module1'
            }, {
                'name': 'Module2'
            }, {
                'name': 'Module4'
            }]);

        });
    });
});