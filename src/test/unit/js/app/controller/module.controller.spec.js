/*global Date:true*/
define(["moduleController", "angularMocks", "utils", "testData"], function(ModuleController, mocks, utils, testData) {
    describe("op unit controller", function() {

        var scope, moduleController, orgUnitService, mockOrgStore, db, q, location, _Date, datasets, sections, dataElements, sectionsdata, datasetsdata, dataElementsdata;

        beforeEach(mocks.inject(function($rootScope, $q, $location) {
            scope = $rootScope.$new();
            q = $q;
            location = $location;

            orgUnitService = {
                "create": function() {},
                "getDatasetsAssociatedWithOrgUnit": function() {},
                "associateDataSetsToOrgUnit": function() {},
                "setSystemSettings": function() {}
            };
            mockOrgStore = {
                upsert: function() {},
                getAll: function() {}
            };
            db = {
                objectStore: function() {}
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

            var getMockStore = function(data) {
                var getAll = function() {
                    return utils.getPromise(q, data);
                };
                var upsert = function() {};
                var find = function() {};
                return {
                    getAll: getAll,
                    upsert: upsert,
                    find: find
                };
            };

            sectionsdata = testData["sections"];
            datasetsdata = testData["dataSets"];
            dataElementsdata = testData["dataElements"];

            sections = getMockStore(sectionsdata);
            datasets = getMockStore(datasetsdata);
            dataElements = getMockStore(dataElementsdata);

            scope.orgUnit = {
                'name': 'SomeName',
                'id': 'someId'
            };
            scope.isEditMode = true;

            spyOn(db, 'objectStore').and.callFake(function(storeName) {
                if (storeName === "dataSets")
                    return datasets;
                if (storeName === "sections")
                    return sections;
                if (storeName === "dataElements")
                    return dataElements;
                return getMockStore(testData[storeName]);
            });
            moduleController = new ModuleController(scope, orgUnitService, db, location, q);
        }));

        afterEach(function() {
            Date = _Date;
        });

        it("should put all datasets in scope on init", function() {
            scope.$apply();

            expect(scope.allDatasets).toEqual(datasetsdata);
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

            spyOn(orgUnitService, "create").and.returnValue(utils.getPromise(q, {}));
            spyOn(orgUnitService, "associateDataSetsToOrgUnit").and.returnValue(utils.getPromise(q, {}));
            spyOn(orgUnitService, "setSystemSettings").and.returnValue(utils.getPromise(q, {}));


            scope.save(modules);
            scope.$apply();

            expect(orgUnitService.create).toHaveBeenCalled();
            expect(orgUnitService.associateDataSetsToOrgUnit).toHaveBeenCalled();
            expect(orgUnitService.setSystemSettings).toHaveBeenCalled();
        });

        xit("should set datasets associated with module for view", function() {

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

            spyOn(orgUnitService, "getDatasetsAssociatedWithOrgUnit").and.returnValue(utils.getPromise(q, datasets));
            moduleController = new ModuleController(scope, orgUnitService, db, location, q);
            scope.$apply();

            expect(scope.modules[0].name).toEqual("Mod2");
            expect(scope.modules[0].datasets).toEqual(datasetsdata);
            expect(scope.modules[0].allDatasets).toEqual([{
                name: "Malaria",
                id: "dataset_1"
            }, {
                name: 'TB',
                id: 'dataset_3'
            }]);
        });

        it("should return true if datasets for modules not selected", function() {
            var modules = [{
                'name': "Module1",
                'datasets': []
            }];

            expect(scope.areDatasetsNotSelected(modules)).toEqual(true);
        });

        it("should return false if datasets for modules are selected", function() {
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

            expect(scope.areDatasetsNotSelected(modules)).toEqual(false);
        });
    });
});