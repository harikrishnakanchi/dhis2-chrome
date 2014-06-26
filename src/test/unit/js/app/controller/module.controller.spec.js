/*global Date:true*/
define(["moduleController", "angularMocks", "utils", "testData"], function(ModuleController, mocks, utils, testData) {
    describe("module controller", function() {

        var scope, moduleController, orgUnitService, mockOrgStore, db, q, location, _Date, datasets, sections,
            dataElements, sectionsdata, datasetsdata, dataElementsdata, orgUnitRepo, hustle, dataSetRepo;

        beforeEach(module('hustle'));
        beforeEach(mocks.inject(function($rootScope, $q, $hustle, $location) {
            scope = $rootScope.$new();
            q = $q;
            hustle = $hustle;
            location = $location;

            orgUnitService = {
                "create": function() {},
                "getAssociatedDatasets": function() {},
                "associateDataSetsToOrgUnit": function() {},
                "setSystemSettings": function() {},
                "getSystemSettings": function() {},
                "getAll": function() {
                    return utils.getPromise(q, {});
                }
            };

            orgUnitRepo = {
                'save': function() {}
            };

            dataSetRepo = {
                'upsert': function() {}
            };

            mockOrgStore = {
                upsert: function() {},
                getAll: function() {}
            };
            db = {
                objectStore: function() {}
            };
            scope.orgUnit = {
                id: "blah"
            };
            _Date = Date;
            todayStr = "2014-04-01";
            today = new Date(todayStr);
            Date = function() {
                return today;
            };

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

            sectionsdata = testData.get("sections");
            datasetsdata = testData.get("dataSets");
            dataElementsdata = testData.get("dataElements");

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
                return getMockStore(testData.get(storeName));
            });
            moduleController = new ModuleController(scope, hustle, orgUnitService, orgUnitRepo, dataSetRepo, db, location, q);
        }));

        afterEach(function() {
            Date = _Date;
        });

        it('should filter in new data models when adding new modules', function() {
            scope.$apply();

            scope.addModules();

            expect(scope.modules[1].allDatasets.length).toEqual(1);
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
                    'id': 'DS_OPD',
                    'name': 'dataset11',
                }]
            }];
            var moduleList = [{
                name: 'Module1',
                shortName: 'Module1',
            }];

            var enrichedModules =
                [{
                name: 'Module1',
                shortName: 'Module1',
                id: 'f21423b161d',
                level: NaN,
                openingDate: '2014-04-01',
                selectedDataset: undefined,
                selectedSections: undefined,
                selectedDataElements: undefined,
                attributeValues: [{
                    attribute: {
                        id: 'a1fa2777924'
                    },
                    value: 'Module'
                }],
                parent: {
                    name: 'Project1',
                    id: 'someid'
                }
            }];

            spyOn(orgUnitRepo, "save").and.returnValue(utils.getPromise(q, enrichedModules));
            spyOn(hustle, "publish").and.returnValue(utils.getPromise(q, {}));
            spyOn(dataSetRepo, "upsert").and.returnValue(utils.getPromise(q, {}));


            scope.save(modules);
            scope.$apply();

            expect(scope.saveFailure).toBe(false);
            expect(orgUnitRepo.save).toHaveBeenCalledWith(enrichedModules);
            expect(hustle.publish).toHaveBeenCalledWith({
                data: enrichedModules,
                type: "createOrgUnit"
            }, "dataValues");

            expect(dataSetRepo.upsert).toHaveBeenCalled();
            expect(hustle.publish).toHaveBeenCalled();
        });

        it("should set datasets associated with module for view", function() {

            var dataSets = [{
                name: 'OPD',
                id: 'DS_OPD',
                organisationUnits: [{
                    id: 'Module1'
                }],
                "attributeValues": [{
                    "attribute": {
                        "id": "wFC6joy3I8Q",
                        "name": "currentDataModel",
                        "created": "2014-05-30T09:38:35.398+0000",
                        "lastUpdated": "2014-05-30T09:38:35.398+0000"
                    },
                    "value": "true"
                }],
                sections: [{
                    id: 'Sec1',
                    dataSet: {
                        id: "Module1"
                    },
                    dataElements: [{
                        id: 'DE1',
                        name: 'DE1 - ITFC'
                    }, {
                        id: 'DE2',
                        name: 'DE2 - ITFC'
                    }, {
                        id: 'DE4',
                        name: 'DE4 - ITFC'
                    }]
                }]
            }];

            var systemSettings = {
                "key": "123",
                "value": {
                    "excludedDataElements": {
                        "Mod2Id": ['DE4']
                    }
                }
            };

            var expectedModule = {
                name: 'Mod2',
                datasets: [{
                    name: 'OPD',
                    id: 'DS_OPD',
                    organisationUnits: [{
                        id: 'Module1'
                    }],
                    attributeValues: [{
                        attribute: {
                            id: 'wFC6joy3I8Q',
                            name: 'currentDataModel',
                            created: '2014-05-30T09:38:35.398+0000',
                            lastUpdated: '2014-05-30T09:38:35.398+0000'
                        },
                        value: 'true'
                    }],
                    sections: [{
                        id: 'Sec1',
                        dataSet: {
                            id: 'Module1'
                        },
                        dataElements: [{
                            id: 'DE1',
                            name: 'DE1 - ITFC'
                        }, {
                            id: 'DE2',
                            name: 'DE2 - ITFC'
                        }]
                    }]
                }],
                selectedDataset: {
                    name: 'OPD',
                    id: 'DS_OPD',
                    organisationUnits: [{
                        id: 'Module1'
                    }],
                    attributeValues: [{
                        attribute: {
                            id: 'wFC6joy3I8Q',
                            name: 'currentDataModel',
                            created: '2014-05-30T09:38:35.398+0000',
                            lastUpdated: '2014-05-30T09:38:35.398+0000'
                        },
                        value: 'true'
                    }],
                    sections: [{
                        id: 'Sec1',
                        dataSet: {
                            id: 'Module1'
                        },
                        dataElements: [{
                            id: 'DE1',
                            name: 'DE1 - ITFC'
                        }, {
                            id: 'DE2',
                            name: 'DE2 - ITFC'
                        }]
                    }]
                }
            }

            scope.orgUnit = {
                "name": "Mod2",
                "id": "Mod2Id",
                "parent": {
                    id: "test"
                }
            };

            scope.isEditMode = false;

            spyOn(orgUnitService, "getAssociatedDatasets").and.returnValue(dataSets);
            spyOn(orgUnitService, "getSystemSettings").and.returnValue(utils.getPromise(q, systemSettings));
            moduleController = new ModuleController(scope, hustle, orgUnitService, orgUnitRepo, dataSetRepo, db, location, q);
            scope.$apply();

            expect(scope.modules[0].name).toEqual("Mod2");
            expect(scope.modules[0]).toEqual(expectedModule);

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

        it("should return true if dataset is not selected", function() {
            var modules = [{
                'name': "Module1",
                'datasets': []
            }];

            expect(scope.areDatasetsNotSelected(modules)).toEqual(true);
        });

        it("should de-select all data elements if the section containing it is de-selected", function() {
            var module = {
                "selectedDataElements": {
                    "test1": true,
                    "test2": true,
                    "test3": true
                },
                "selectedSections": {
                    "sec1": true
                }
            };

            var section = {
                'id': "sec1",
                "dataElements": [{
                    'id': "test1"
                }, {
                    'id': "test2"
                }, {
                    'id': "test3"
                }]
            };

            var expectedModule = {
                "selectedDataElements": {
                    "test1": false,
                    "test2": false,
                    "test3": false
                },
                "selectedSections": {
                    "sec1": false
                }
            };

            module.selectedSections["sec1"] = false;
            scope.changeSectionSelection(module, section);
            expect(module).toEqual(expectedModule);
        });

        it("should de-select the section if all data elements under it are de-selected", function() {
            var module = {
                "selectedDataElements": {
                    "test1": true,
                    "test2": true,
                    "test3": true
                },
                "selectedSections": {
                    "sec1": true
                }
            };

            var section = {
                'id': "sec1",
                "dataElements": [{
                    'id': "test1"
                }, {
                    'id': "test2"
                }, {
                    'id': "test3"
                }]
            };

            var expectedModule = {
                "selectedDataElements": {
                    "test1": false,
                    "test2": false,
                    "test3": false
                },
                "selectedSections": {
                    "sec1": false
                }
            };

            module.selectedDataElements["test1"] = false;
            module.selectedDataElements["test2"] = false;
            module.selectedDataElements["test3"] = false;
            scope.changeDataElementSelection(module, section);
            expect(module).toEqual(expectedModule);
        });

        it("should select a dataset", function() {
            var module = {
                "selectedDataElements": {
                    "test1": true,
                    "test2": true,
                    "test3": true
                },
                "selectedSections": {
                    "sec1": true
                }
            };
            var dataset = {
                name: "Malaria",
                id: "dataset_1",
                sections: [{
                    'id': 'Id1'
                }, {
                    'id': 'Id2'
                }]
            };
            scope.selectDataSet(module, dataset);
            expect(module.selectedDataset).toEqual(dataset);
            expect(scope.isExpanded['Id1']).toEqual(true);
            expect(scope.isExpanded['Id2']).toEqual(false);
        });

        it("should select a dataset", function() {
            var module = {
                "selectedDataElements": {
                    "test1": true,
                    "test2": true,
                    "test3": true
                },
                "selectedSections": {
                    "sec1": true
                }
            };
            var dataset = {
                name: "Malaria",
                id: "dataset_1",
                sections: [{
                    'id': 'Id1'
                }, {
                    'id': 'Id2'
                }]
            };
            scope.selectDataSet(module, dataset);
            expect(module.selectedDataset).toEqual(dataset);
            expect(scope.isExpanded['Id1']).toEqual(true);
            expect(scope.isExpanded['Id2']).toEqual(false);
        });

        it("should return true if no section is selected from each dataset", function() {
            var module = {
                "selectedSections": {
                    "someId": true
                },
                "datasets": [{
                    "sections": [{
                        "name": "section1",
                        "id": "section_1"
                    }, {
                        "name": "section2",
                        "id": "section_2"
                    }]
                }]
            };

            expect(scope.areNoSectionsSelected([module])).toEqual(true);
        });

        it("should return false if any one section is selected from each dataset", function() {
            var module = {
                "selectedSections": {
                    "section_1": true,
                    "section_3": true
                },
                "datasets": [{
                    "sections": [{
                        "name": "section1",
                        "id": "section_1"
                    }, {
                        "name": "section2",
                        "id": "section_2"
                    }]
                }, {
                    "sections": [{
                        "name": "section3",
                        "id": "section_3"
                    }]
                }]
            };

            expect(scope.areNoSectionsSelected([module])).toEqual(false);
        });

        it("should return true if no section is selected for dataset", function() {
            var dataset = {
                "sections": [{
                    "name": "section1",
                    "id": "section_1"
                }, {
                    "name": "section2",
                    "id": "section_2"
                }]
            };

            var module = {
                "selectedSections": {
                    "someId": true
                },
            };

            expect(scope.areNoSectionsSelectedForDataset(module, dataset)).toEqual(true);
        });

        it("should return false if any one section is selected for dataset", function() {
            var dataset = {
                "sections": [{
                    "name": "section1",
                    "id": "section_1"
                }, {
                    "name": "section2",
                    "id": "section_2"
                }]
            };

            var module = {
                "selectedSections": {
                    "section_1": true
                },
            };

            expect(scope.areNoSectionsSelectedForDataset(module, dataset)).toEqual(false);
        });

        it("should not collapse the first section", function() {
            var currentSection = {
                "name": "test",
                "id": 2,
                "lastName": "testing"
            };

            var allSections = [{
                "name": "test",
                "id": 2
            }, {
                "name": "test1",
                "id": 3
            }, {
                "name": "test2",
                "id": 4
            }];

            scope.shouldCollapse(currentSection, allSections);

            expect(scope.isExpanded[2]).toEqual(true);
            expect(scope.isExpanded[3]).toEqual(undefined);
            expect(scope.isExpanded[4]).toEqual(undefined);
        });
    });
});