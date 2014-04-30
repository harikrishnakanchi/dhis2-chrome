/*global Date:true*/
define(["moduleController", "angularMocks", "utils"], function(ModuleController, mocks, utils) {
    describe("op unit controller", function() {

        var scope, moduleController, projectsService, mockOrgStore, db, q, location, _Date, datasets;

        beforeEach(mocks.inject(function($rootScope, $q, $location) {
            scope = $rootScope.$new();
            q = $q;
            location = $location;

            projectsService = {
                "create": function() {},
                "getDatasetsAssociatedWithOrgUnit": function() {},
                "associateDataSetsToOrgUnit": function() {}
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
            }, {
                "id": "DS1",
                "organisationUnits": [{
                    "name": "Mod2",
                    "id": "Mod2Id"
                }]
            }];

            scope.orgUnit = {
                'name': 'SomeName',
                'id': 'someId'
            };
            scope.isEditMode = true;

            spyOn(db, 'objectStore').and.returnValue(mockOrgStore);
            spyOn(mockOrgStore, 'getAll').and.returnValue(utils.getPromise(q, datasets));
            moduleController = new ModuleController(scope, projectsService, db, location);
        }));

        afterEach(function() {
            Date = _Date;
        });

        it("should put all datasets in scope on init", function() {
            scope.$apply();

            expect(scope.allDatasets).toEqual(datasets);
            expect(scope.modules[0].allDatasets).toEqual(datasets);
        });

        it('should add new modules', function() {
            scope.$apply();
            scope.addModules();

            expect(scope.modules.length).toBe(2);
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

            scope.delete(2);
            scope.$apply();

            expect(scope.modules[0].name).toEqual('Module1');
            expect(scope.modules[1].name).toEqual('Module2');
            expect(scope.modules[2].name).toEqual('Module4');
        });

        it("should save the modules and the associated datasets", function() {
            scope.orgUnit = {
                "name": "Project1",
                "id": "someid"
            };

            var modules = [{
                'name': "Module1",
                'datasets': [{
                    'id': 'ds_11',
                    'name': 'dataset11',
                }, {
                    'id': 'ds_12',
                    'name': 'dataset12'
                }]
            }];
            var moduleList = [{
                name: 'Module1',
                shortName: 'Module1',
            }];

            spyOn(projectsService, "create").and.returnValue(utils.getPromise(q, {}));
            spyOn(projectsService, "associateDataSetsToOrgUnit").and.returnValue(utils.getPromise(q, {}));

            scope.save(modules);
            scope.$apply();

            expect(projectsService.create).toHaveBeenCalled();
            expect(projectsService.associateDataSetsToOrgUnit).toHaveBeenCalled();
        });

        it("should set datasets associated with module for view", function() {

            var datasets = [{
                "id": "DS1",
                "organisationUnits": [{
                    "name": "Mod2",
                    "id": "Mod2Id"
                }]
            }];

            scope.orgUnit = {
                "name": "Mod2",
                "id": "Mod2Id"
            };

            scope.isEditMode = false;

            spyOn(projectsService, "getDatasetsAssociatedWithOrgUnit").and.returnValue(utils.getPromise(q, datasets));
            moduleController = new ModuleController(scope, projectsService, db, location);
            scope.$apply();

            expect(scope.modules[0].name).toEqual("Mod2");
            expect(scope.modules[0].datasets).toEqual(datasets);
            expect(scope.modules[0].allDatasets).toEqual([{
                name: "Malaria",
                id: "dataset_1"
            }, {
                name: 'TB',
                id: 'dataset_3'
            }]);
        });
    });
});