/*global Date:true*/
define(["moduleController", "angularMocks", "utils", "testData", "datasetTransformer"], function(ModuleController, mocks, utils, testData, datasetTransformer) {
    describe("module controller", function() {
        var scope, moduleController, orgUnitService, mockOrgStore, db, q, location, _Date, datasets, sections,
            dataElements, sectionsdata, datasetsdata, dataElementsdata, orgUnitRepo, hustle, dataSetRepo, systemSettingRepo, fakeModal;

        beforeEach(module('hustle'));
        beforeEach(mocks.inject(function($rootScope, $q, $hustle, $location) {
            scope = $rootScope.$new();
            q = $q;
            hustle = $hustle;
            spyOn(hustle, "publish").and.returnValue(utils.getPromise(q, {}));

            location = $location;

            orgUnitService = {
                "getAssociatedDatasets": function() {},
            };

            orgUnitRepo = utils.getMockRepo(q);
            dataSetRepo = utils.getMockRepo(q);
            systemSettingRepo = utils.getMockRepo(q);
            systemSettingRepo.getAllWithProjectId = function() {};

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

            fakeModal = {
                close: function() {
                    this.result.confirmCallBack();
                },
                dismiss: function(type) {
                    this.result.cancelCallback(type);
                },
                open: function(object) {}
            };

            sectionsdata = testData.get("sections");
            datasetsdata = testData.get("dataSets");
            dataElementsdata = testData.get("dataElements");

            sections = getMockStore(sectionsdata);
            datasets = getMockStore(datasetsdata);
            dataElements = getMockStore(dataElementsdata);

            scope.orgUnit = {
                'name': 'SomeName',
                'id': 'someId',
                "parent": {
                    "id": "blah1"
                }
            };
            scope.isNewMode = true;

            spyOn(db, 'objectStore').and.callFake(function(storeName) {
                if (storeName === "dataSets")
                    return datasets;
                if (storeName === "sections")
                    return sections;
                if (storeName === "dataElements")
                    return dataElements;
                return getMockStore(testData.get(storeName));
            });
            moduleController = new ModuleController(scope, hustle, orgUnitService, orgUnitRepo, dataSetRepo, systemSettingRepo, db, location, q, fakeModal);
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

            scope.deleteModule(2);
            scope.$apply();

            expect(scope.modules[0].name).toEqual('Module1');
            expect(scope.modules[1].name).toEqual('Module2');
            expect(scope.modules[2].name).toEqual('Module4');
        });

        it('should exclude data elements', function() {

            var projectId = 1;

            var modules = [{
                name: "test1",
                id: projectId,
                datasets: [{
                    sections: [{
                        dataElements: [{
                            "id": "1",
                            "isIncluded": false
                        }, {
                            "id": "2",
                            "isIncluded": true
                        }, {
                            "id": "3",
                            "isIncluded": false
                        }]
                    }]
                }]
            }];

            scope.orgUnit = {
                name: "test1",
                id: projectId
            };

            var expectedSystemSettings = {
                "excludedDataElements": {
                    "1": ["1", "3"]
                }
            };

            var expectedPayload = {
                projectId: projectId,
                settings: expectedSystemSettings
            };

            var expectedHustleMessage = {
                data: expectedPayload,
                type: "excludeDataElements"
            };

            spyOn(scope, "createModules").and.returnValue(utils.getPromise(q, modules));
            spyOn(scope, "associateDatasets").and.returnValue(utils.getPromise(q, modules));

            scope.save(modules);
            scope.$apply();

            expect(scope.saveFailure).toBe(false);
            expect(systemSettingRepo.upsert).toHaveBeenCalledWith(expectedPayload);
            expect(hustle.publish).toHaveBeenCalledWith(expectedHustleMessage, 'dataValues');
        });

        it("should create module", function() {
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
                    datasets: [{
                        'id': 'DS_OPD',
                        'name': 'dataset11',
                    }],
                    shortName: 'Module1',
                    id: 'adba40b7157',
                    level: NaN,
                    openingDate: '2014-04-01',
                    selectedDataset: undefined,
                    attributeValues: [{
                        attribute: {
                            code: "Type",
                            name: "Type",
                            id: 'a1fa2777924'
                        },
                        value: 'Module'
                    }],
                    parent: {
                        name: 'Project1',
                        id: 'someid'
                    }
                }];

            scope.save(modules);
            scope.$apply();

            expect(scope.saveFailure).toBe(false);
            expect(orgUnitRepo.upsert).toHaveBeenCalledWith(enrichedModules);
            expect(hustle.publish).toHaveBeenCalledWith({
                data: enrichedModules,
                type: "upsertOrgUnit"
            }, "dataValues");
        });

        it("should associate data sets to module", function() {

            scope.originalDatasets = [{
                'id': 'ds_11',
                'name': 'dataset11',
            }, {
                'id': 'ds_12',
                'name': 'dataset12'
            }];

            scope.orgUnit = {
                'id': 'Project1Id',
                'name': 'Project1'
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
            }, {
                'name': "Module2",
                'datasets': [{
                    'id': 'ds_11',
                    'name': 'dataset21',
                }]
            }];

            var expectedDatasets = [{
                id: 'ds_11',
                name: 'dataset11',
                organisationUnits: [{
                    name: 'Module1',
                    id: 'aac1bbd0985'
                }, {
                    name: 'Module2',
                    id: 'acccf1dda36'
                }]
            }, {
                id: 'ds_12',
                name: 'dataset12',
                organisationUnits: [{
                    name: 'Module1',
                    id: 'aac1bbd0985'
                }]
            }];

            spyOn(scope, "createModules").and.returnValue(utils.getPromise(q, modules));
            spyOn(scope, "excludeDataElements").and.returnValue(utils.getPromise(q, modules));

            scope.save(modules);
            scope.$apply();
            expect(scope.saveFailure).toBe(false);
            expect(hustle.publish).toHaveBeenCalledWith({
                data: expectedDatasets,
                type: "associateDataset"
            }, "dataValues");

            expect(dataSetRepo.upsert).toHaveBeenCalledWith(expectedDatasets);
        });

        it("should set datasets associated with module for edit", function() {
            scope.orgUnit = {
                "id": "mod2",
                "parent": {
                    "id": "par1"
                }
            };
            scope.isNewMode = false;
            moduleController = new ModuleController(scope, hustle, orgUnitService, orgUnitRepo, dataSetRepo, systemSettingRepo, db, location, q, fakeModal);

            scope.$apply();

            expect(scope.isDisabled).toBeFalsy();
            expect(scope.modules[0].datasets.length).toEqual(1);
            expect(scope.modules[0].allDatasets.length).toEqual(0);
            expect(scope.modules[0].selectedDataset).toEqual(scope.modules[0].datasets[0]);
        });

        it("should disable update and diable if orgunit is disabled", function() {
            scope.orgUnit = {
                "id": "mod2",
                "parent": {
                    "id": "par1"
                },
                "attributeValues": [{
                    "attribute": {
                        "code": "isDisabled"
                    },
                    "value": true
                }]
            };
            scope.isNewMode = false;
            moduleController = new ModuleController(scope, hustle, orgUnitService, orgUnitRepo, dataSetRepo, systemSettingRepo, db, location, q, fakeModal);

            scope.$apply();

            expect(scope.isDisabled).toBeTruthy();
        });

        it("should update module", function() {
            scope.orgUnit = {
                "id": "mod2",
                "parent": {
                    "id": "par1"
                }
            };
            scope.isNewMode = false;
            moduleController = new ModuleController(scope, hustle, orgUnitService, orgUnitRepo, dataSetRepo, systemSettingRepo, db, location, q, fakeModal);
            spyOn(scope, "excludeDataElements").and.returnValue(utils.getPromise(q, []));

            scope.update(scope.modules);
            scope.$apply();

            expect(scope.excludeDataElements).toHaveBeenCalledWith('par1', scope.modules);
        });

        it("should exclude modules", function() {
            var modules = [{
                "id": "mod1"
            }];

            scope.excludeDataElements("proj1", modules);

            var expectedSystemSettings = {
                projectId: 'proj1',
                settings: {
                    excludedDataElements: {
                        mod1: []
                    }
                }
            };
            var expectedMessage = {
                data: {
                    projectId: 'proj1',
                    settings: {
                        excludedDataElements: {
                            mod1: []
                        }
                    }
                },
                type: 'excludeDataElements'
            };
            expect(systemSettingRepo.upsert).toHaveBeenCalledWith(expectedSystemSettings);
            expect(hustle.publish).toHaveBeenCalledWith(expectedMessage, 'dataValues');
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
            var section = {
                'id': "sec1",
                "dataElements": [{
                    'id': "test1"
                }, {
                    'id': "test2"
                }, {
                    'id': "test3"
                }],
                isIncluded: false
            };

            var expectedSection = {
                id: 'sec1',
                dataElements: [{
                    id: 'test1',
                    isIncluded: false
                }, {
                    id: 'test2',
                    isIncluded: false
                }, {
                    id: 'test3',
                    isIncluded: false
                }],
                isIncluded: false
            };

            scope.changeSectionSelection(section);
            expect(section).toEqual(expectedSection);
        });

        it("should de-select the section if all data elements under it are de-selected", function() {
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

            var expectedSection = {
                id: 'sec1',
                dataElements: [{
                    id: 'test1'
                }, {
                    id: 'test2'
                }, {
                    id: 'test3'
                }],
                isIncluded: false
            };

            scope.changeDataElementSelection(section);
            expect(section).toEqual(expectedSection);
        });

        it("should select a dataset", function() {

            var module = {
                "id": "mod1"
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
            expect(scope.isExpanded.Id1).toEqual(true);
            expect(scope.isExpanded.Id2).toEqual(false);
        });

        it("should return true if no section is selected from each dataset", function() {
            var module = {
                datasets: [{
                    "sections": [{
                        "name": "section1",
                        "id": "section_1",
                        "dataElements": [{
                            "id": "de1",
                            "isIncluded": false
                        }, {
                            "id": "de2",
                            "isIncluded": false
                        }]
                    }, {
                        "name": "section2",
                        "id": "section_2",
                        "dataElements": [{
                            "id": "de3",
                            "isIncluded": false
                        }]
                    }]
                }]
            };

            expect(scope.areNoSectionsSelected([module])).toEqual(true);
        });

        it("should return false if any one section is selected from each dataset", function() {

            var module = {
                datasets: [{
                    "sections": [{
                        "name": "section1",
                        "id": "section_1",
                        "dataElements": [{
                            "id": "de1",
                            "isIncluded": true
                        }, {
                            "id": "de2",
                            "isIncluded": true
                        }]
                    }, {
                        "name": "section2",
                        "id": "section_2",
                        "dataElements": [{
                            "id": "de3",
                            "isIncluded": false
                        }]
                    }]
                }]
            };

            expect(scope.areNoSectionsSelected([module])).toEqual(false);
        });

        it("should return true if no section is selected for dataset", function() {

            var dataset = {
                "sections": [{
                    "name": "section1",
                    "id": "section_1",
                    "dataElements": [{
                        "id": "de1",
                        "isIncluded": false
                    }, {
                        "id": "de2",
                        "isIncluded": false
                    }]
                }, {
                    "name": "section2",
                    "id": "section_2",
                    "dataElements": [{
                        "id": "de3",
                        "isIncluded": false
                    }]
                }]
            };

            expect(scope.areNoSectionsSelectedForDataset(dataset)).toEqual(true);
        });

        it("should return false if any one section is selected for dataset", function() {

            var dataset = {
                "sections": [{
                    "name": "section1",
                    "id": "section_1",
                    "dataElements": [{
                        "id": "de1",
                        "isIncluded": true
                    }, {
                        "id": "de2",
                        "isIncluded": false
                    }]
                }, {
                    "name": "section2",
                    "id": "section_2",
                    "dataElements": [{
                        "id": "de3",
                        "isIncluded": false
                    }]
                }]
            };

            expect(scope.areNoSectionsSelectedForDataset(dataset)).toEqual(false);
        });

        it("should disable modules", function() {
            scope.$parent.closeNewForm = jasmine.createSpy();
            scope.resourceBundle = {};
            var module = {
                name: "test1",
                id: "projectId",
                datasets: [],
                attributeValues: []
            };

            var expectedModule = {
                name: "test1",
                id: "projectId",
                datasets: [],
                attributeValues: [{
                    attribute: {
                        code: 'isDisabled',
                        name: 'Is Disabled',
                        id: 'HLcCYZ1pPQx'
                    },
                    value: true
                }]
            };
            var expectedHustleMessage = {
                data: expectedModule,
                type: "upsertOrgUnit"
            };
            spyOn(fakeModal, "open").and.returnValue({
                result: utils.getPromise(q, {})
            });

            scope.disable(module);
            scope.$apply();

            expect(orgUnitRepo.upsert).toHaveBeenCalledWith(expectedModule);
            expect(hustle.publish).toHaveBeenCalledWith(expectedHustleMessage, 'dataValues');
            expect(scope.$parent.closeNewForm).toHaveBeenCalledWith(module);
            expect(scope.isDisabled).toEqual(true);
        });
    });
});