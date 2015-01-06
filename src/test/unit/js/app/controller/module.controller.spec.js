/*global Date:true*/
define(["moduleController", "angularMocks", "utils", "testData", "datasetTransformer", "orgUnitGroupHelper", "moment", "md5"], function(ModuleController, mocks, utils, testData, datasetTransformer, OrgUnitGroupHelper, moment, md5) {
    describe("module controller", function() {
        var scope, moduleController, orgUnitService, mockOrgStore, db, q, location, _Date, datasets, sections,
            dataElements, sectionsdata, datasetsdata, dataElementsdata, orgUnitRepo, orgunitGroupRepo, hustle, dataSetRepo, systemSettingRepo, fakeModal, allPrograms, programsRepo;

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
            orgunitGroupRepo = utils.getMockRepo(q);
            dataSetRepo = utils.getMockRepo(q);
            systemSettingRepo = utils.getMockRepo(q);
            systemSettingRepo.getAllWithProjectId = function() {};
            systemSettingRepo.upsert = function() {};
            programsRepo = utils.getMockRepo(q);
            programsRepo.getProgramAndStages = function() {};
            orgUnitGroupHelper = new OrgUnitGroupHelper(hustle, q, scope, orgUnitRepo, orgunitGroupRepo);

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

            allPrograms = [{
                'id': 'prog1',
                'name': 'ER Linelist',
                'organisationUnits': []
            }];

            sectionsdata = testData.get("sections");
            datasetsdata = testData.get("dataSets");
            dataElementsdata = testData.get("dataElements");

            sections = getMockStore(sectionsdata);
            datasets = getMockStore(datasetsdata);
            dataElements = getMockStore(dataElementsdata);
            programs = getMockStore(allPrograms);

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
                if (storeName === "programs")
                    return programs;
                return getMockStore(testData.get(storeName));
            });
            moduleController = new ModuleController(scope, hustle, orgUnitService, orgUnitRepo, dataSetRepo, systemSettingRepo, db, location, q, fakeModal, programsRepo, orgunitGroupRepo, orgUnitGroupHelper);
        }));

        afterEach(function() {
            Date = _Date;
        });

        it("should fetch is expanded for a particular module based on timestamp", function() {
            var module = {
                "timestamp": "2014-12-22"
            };
            expect(scope.getIsExpanded(module)).toEqual({});
        });

        it("should fetch is expanded for existing modules that don't have a timestamp", function() {
            var module = {};
            expect(scope.getIsExpanded(module)).toEqual({});
            expect(module.timestamp).toEqual(1396310400000);
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
                serviceType: "Aggregate",
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
                data: {
                    projectId: projectId,
                    settings: expectedSystemSettings,
                    indexedDbOldSystemSettings: {
                        excludedDataElements: {
                            1: ['1', '3']
                        }
                    }
                },
                type: "excludeDataElements",
            };

            spyOn(scope, "createModules").and.returnValue(utils.getPromise(q, modules));
            spyOn(scope, "associateDatasets").and.returnValue(utils.getPromise(q, modules));

            spyOn(systemSettingRepo, "getAllWithProjectId").and.returnValue(utils.getPromise(q, {
                "key": projectId,
                "value": expectedSystemSettings
            }));
            spyOn(systemSettingRepo, "upsert").and.returnValue(utils.getPromise(q, {}));

            scope.save(modules);
            scope.$apply();

            expect(scope.saveFailure).toBe(false);
            expect(systemSettingRepo.upsert).toHaveBeenCalledWith(expectedPayload);
            expect(hustle.publish).toHaveBeenCalledWith(expectedHustleMessage, 'dataValues');
        });

        it("should save aggregate and linelist module excludeDataElement system-setting", function() {
            scope.orgUnit = {
                "name": "Project1",
                "id": "someid",
                "children": []
            };

            var aggregateModule = {
                'name': "Module1",
                'serviceType': "Aggregate",
                'datasets': [{
                    'id': 'DS_OPD',
                    'name': 'dataset11',
                    'sections': [{
                        'dataElements': [{
                            'isIncluded': false,
                            'id': 'de1'
                        }, {
                            'isIncluded': true,
                            'id': 'de2'
                        }]
                    }]
                }]
            };

            var LinelistModule = {
                'name': "Module2",
                'serviceType': "Linelist",
                'enrichedProgram': {
                    'programStages': [{
                        'programStageSections': [{
                            'programStageDataElements': [{
                                'dataElement': {
                                    'isIncluded': false,
                                    'id': 'de3'
                                }
                            }, {
                                'dataElement': {
                                    'isIncluded': true,
                                    'id': 'de4'
                                }
                            }]
                        }]
                    }]
                },
                'program': {
                    'id': 'prog1',
                    'name': 'ER Linelist',
                    'organisationUnits': []
                }
            };

            var modules = [aggregateModule, LinelistModule];

            var data = {
                "key": "someid",
                "value": {
                    "excludedDataElements": {
                        "module3": ["de3", "de4"],
                        "adba40b7157": ["de4"]
                    }
                }
            };

            spyOn(systemSettingRepo, "getAllWithProjectId").and.returnValue(utils.getPromise(q, data));
            spyOn(systemSettingRepo, "upsert").and.returnValue(utils.getPromise(q, {}));
            scope.save(modules);
            scope.$apply();

            expect(scope.saveFailure).toBe(false);
            expect(systemSettingRepo.getAllWithProjectId).toHaveBeenCalledWith("someid");

            var expectedSystemSettingsPayload = {
                "projectId": "someid",
                "settings": {
                    "excludedDataElements": {
                        "module3": ["de3", "de4"],
                        "adba40b7157": ["de1"],
                        "a1ab18b5fdd": ["de3"]
                    }
                }
            };
            expect(systemSettingRepo.upsert).toHaveBeenCalledWith(expectedSystemSettingsPayload);

            var hustlePayload = {
                "projectId": "someid",
                "settings": expectedSystemSettingsPayload.settings,
                "indexedDbOldSystemSettings": {
                    "excludedDataElements": {
                        "module3": ["de3", "de4"],
                        "adba40b7157": ["de4"]
                    }
                }
            };

            expect(hustle.publish).toHaveBeenCalledWith({
                data: hustlePayload,
                type: "excludeDataElements"
            }, "dataValues");
        });

        it("should save linelist modules", function() {
            scope.orgUnit = {
                "name": "Project1",
                "id": "someid",
                "children": []
            };

            var modules = [{
                'name': "Module2",
                'serviceType': "Linelist",
                'enrichedProgram': {
                    'programStages': [{
                        'programStageSections': [{
                            'programStageDataElements': [{
                                'dataElement': {
                                    'isIncluded': false,
                                    'id': 'de3'
                                }
                            }, {
                                'dataElement': {
                                    'isIncluded': true,
                                    'id': 'de4'
                                }
                            }]
                        }]
                    }]
                },
                'program': {
                    'id': 'prog1',
                    'name': 'ER Linelist',
                    'organisationUnits': []
                }
            }];

            var enrichedLineListModules = [{
                "name": "Module2",
                "shortName": "Module2",
                "id": "a1ab18b5fdd",
                "level": NaN,
                "openingDate": "2014-04-01",
                "selectedDataset": undefined,
                "datasets": undefined,
                "enrichedProgram": {
                    "programStages": [{
                        "programStageSections": [{
                            "programStageDataElements": [{
                                "dataElement": {
                                    "isIncluded": false,
                                    "id": "de3"
                                }
                            }, {
                                "dataElement": {
                                    "isIncluded": true,
                                    "id": "de4"
                                }
                            }]
                        }]
                    }]
                },
                "attributeValues": [{
                    "attribute": {
                        "code": "Type",
                        "name": "Type"
                    },
                    "value": "Module"
                }, {
                    "attribute": {
                        "code": "isLineListService",
                        "name": "Is Linelist Service"
                    },
                    "value": "true"
                }],
                "parent": {
                    "name": "Project1",
                    "id": "someid"
                }
            }];

            var modifiedParent = {
                "name": "Project1",
                "id": "someid",
                "children": enrichedLineListModules
            };

            var programs = [{
                'id': 'prog1',
                'name': 'ER Linelist',
                'organisationUnits': [{
                    id: 'a1ab18b5fdd',
                    name: 'Module2'
                }],
                "orgUnitIds": ['a1ab18b5fdd']
            }];

            spyOn(systemSettingRepo, "getAllWithProjectId").and.returnValue(utils.getPromise(q, {}));
            spyOn(systemSettingRepo, "upsert").and.returnValue(utils.getPromise(q, {}));
            scope.save(modules);
            scope.$apply();

            expect(scope.saveFailure).toBe(false);
            expect(orgUnitRepo.upsert).toHaveBeenCalledWith(modifiedParent);
            expect(orgUnitRepo.upsert).toHaveBeenCalledWith(enrichedLineListModules);

            expect(hustle.publish).toHaveBeenCalledWith({
                data: enrichedLineListModules,
                type: "upsertOrgUnit"
            }, "dataValues");

            expect(programsRepo.upsert).toHaveBeenCalledWith(programs);
            expect(hustle.publish).toHaveBeenCalledWith({
                data: programs,
                type: "uploadProgram"
            }, "dataValues");
        });

        it("should save aggregate modules", function() {
            scope.orgUnit = {
                "name": "Project1",
                "id": "someid",
                "children": []
            };

            var modules = [{
                'name': "Module1",
                'serviceType': "Aggregate",
                'datasets': [{
                    'id': 'DS_OPD',
                    'name': 'dataset11',
                    'sections': [{
                        'dataElements': [{
                            'isIncluded': false,
                            'id': 'de1'
                        }, {
                            'isIncluded': true,
                            'id': 'de2'
                        }]
                    }]
                }]
            }];

            var enrichedAggregateModules = [{
                name: 'Module1',
                datasets: [{
                    'id': 'DS_OPD',
                    'name': 'dataset11',
                    'sections': [{
                        "dataElements": [{
                            "isIncluded": false,
                            "id": "de1"
                        }, {
                            "isIncluded": true,
                            "id": "de2"
                        }]
                    }]
                }],
                enrichedProgram: undefined,
                shortName: 'Module1',
                id: 'adba40b7157',
                level: NaN,
                openingDate: '2014-04-01',
                selectedDataset: undefined,
                attributeValues: [{
                    attribute: {
                        code: "Type",
                        name: "Type",
                    },
                    value: 'Module'
                }, {
                    attribute: {
                        code: "isLineListService",
                        name: "Is Linelist Service"
                    },
                    value: 'false'
                }],
                parent: {
                    name: 'Project1',
                    id: 'someid'
                }
            }];

            var enrichedParent = {
                "name": "Project1",
                "id": "someid",
                "children": enrichedAggregateModules
            };

            spyOn(systemSettingRepo, "getAllWithProjectId").and.returnValue(utils.getPromise(q, {}));
            spyOn(systemSettingRepo, "upsert").and.returnValue(utils.getPromise(q, {}));
            scope.save(modules);
            scope.$apply();

            expect(scope.saveFailure).toBe(false);
            expect(orgUnitRepo.upsert).toHaveBeenCalledWith(enrichedParent);

            expect(orgUnitRepo.upsert).toHaveBeenCalledWith(enrichedAggregateModules);

            expect(hustle.publish).toHaveBeenCalledWith({
                data: enrichedAggregateModules,
                type: "upsertOrgUnit"
            }, "dataValues");

            var expectedDatasets = [{
                name: 'OPD',
                id: 'DS_OPD',
                organisationUnits: [{
                    id: 'mod1'
                }, {
                    name: 'Module1',
                    id: 'adba40b7157'
                }],
                attributeValues: [{
                    attribute: {
                        id: 'wFC6joy3I8Q',
                        code: 'isNewDataModel'
                    },
                    value: 'false'
                }]
            }];

            expect(dataSetRepo.upsert).toHaveBeenCalledWith(expectedDatasets);
            expect(hustle.publish).toHaveBeenCalledWith({
                data: expectedDatasets,
                type: "associateDataset"
            }, "dataValues");
        });

        it("should set datasets associated with module for edit", function() {
            scope.orgUnit = {
                "id": "mod2",
                "parent": {
                    "id": "par1"
                }
            };

            var newDataSet1 = {
                "id": "dataSet1",
                "name": "NeoNat",
                "attributeValues": [{
                    "attribute": {
                        "code": "isNewDataModel"
                    },
                    "value": 'true'
                }]
            };

            var newDataSet2 = {
                "id": "dataSet2",
                "name": "IPD",
                "attributeValues": [{
                    "attribute": {
                        "code": "isNewDataModel"
                    },
                    "value": 'true'
                }]
            };

            var currentDataSet = {
                "id": "dataSet2",
                "name": "Neonat - V1",
                "attributeValues": [{
                    "attribute": {
                        "code": "isNewDataModel"
                    },
                    "value": 'false'
                }]
            };


            scope.isNewMode = false;

            spyOn(datasetTransformer, "getAssociatedDatasets").and.returnValue([newDataSet1]);
            spyOn(datasetTransformer, 'enrichDatasets').and.returnValue([newDataSet1, newDataSet2, currentDataSet]);
            moduleController = new ModuleController(scope, hustle, orgUnitService, orgUnitRepo, dataSetRepo, systemSettingRepo, db, location, q, fakeModal);
            scope.$apply();

            expect(scope.isDisabled).toBeFalsy();
            expect(scope.modules[0].datasets.length).toEqual(1);
            expect(scope.modules[0].selectedDataset).toEqual(scope.modules[0].datasets[0]);
            expect(scope.modules[0].allDatasets).toEqual([newDataSet2]);
        });

        it("should disable update and diable if orgunit is disabled", function() {
            scope.orgUnit = {
                "id": "mod2",
                "parent": {
                    "id": "par1"
                },
                "dataSets": [{
                    "id": "ds1",
                    "name": "dataset1",
                    "attributeValues": [{
                        "attribute": {
                            "code": "isNewDataModel"
                        },
                        "value": true
                    }]
                }],
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

        it("should update system setting while updating module", function() {
            scope.orgUnit = {
                "id": "mod2",
                "name": "module OLD name",
                "parent": {
                    "id": "par1",
                    "name": "Par1"
                }
            };

            var modules = [{
                name: "module NEW name",
                id: "newId",
                serviceType: "Aggregate",
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

            scope.isNewMode = false;
            spyOn(systemSettingRepo, "getAllWithProjectId").and.returnValue(utils.getPromise(q, {}));
            spyOn(systemSettingRepo, "upsert").and.returnValue(utils.getPromise(q, {}));

            moduleController = new ModuleController(scope, hustle, orgUnitService, orgUnitRepo, dataSetRepo, systemSettingRepo, db, location, q, fakeModal);
            scope.update(modules);
            scope.$apply();

            expect(systemSettingRepo.getAllWithProjectId).toHaveBeenCalledWith("par1");

            var expectedSystemSettingsPayload = {
                projectId: 'par1',
                settings: {
                    excludedDataElements: {
                        "newId": ['1', '3']
                    }
                }
            };
            expect(systemSettingRepo.upsert).toHaveBeenCalledWith(expectedSystemSettingsPayload);

            var hustlePayload = {
                "projectId": "par1",
                "settings": {
                    "excludedDataElements": {
                        "newId": ["1", "3"]
                    }
                },
                "indexedDbOldSystemSettings": {
                    "excludedDataElements": {}
                }
            };

            expect(hustle.publish).toHaveBeenCalledWith({
                data: hustlePayload,
                type: "excludeDataElements"
            }, "dataValues");
        });

        it("should update module name", function() {
            scope.orgUnit = {
                "id": "mod2",
                "name": "module OLD name",
                "parent": {
                    "id": "par1",
                    "name": "Par1"
                }
            };

            var modules = [{
                name: "module NEW name",
                id: "newId",
                serviceType: "Aggregate",
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

            scope.isNewMode = false;
            spyOn(systemSettingRepo, "getAllWithProjectId").and.returnValue(utils.getPromise(q, {}));
            spyOn(systemSettingRepo, "upsert").and.returnValue(utils.getPromise(q, {}));

            moduleController = new ModuleController(scope, hustle, orgUnitService, orgUnitRepo, dataSetRepo, systemSettingRepo, db, location, q, fakeModal);
            scope.update(modules);
            scope.$apply();

            var expectedModules = [{
                name: 'module NEW name',
                shortName: 'module NEW name',
                id: 'mod2',
                level: 6,
                openingDate: moment().format("YYYY-MM-DD"),
                selectedDataset: undefined,
                enrichedProgram: undefined,
                datasets: [{
                    sections: [{
                        dataElements: [{
                            id: '1',
                            isIncluded: false
                        }, {
                            id: '2',
                            isIncluded: true
                        }, {
                            id: '3',
                            isIncluded: false
                        }]
                    }]
                }],
                attributeValues: [{
                    attribute: {
                        code: 'Type',
                        name: 'Type'
                    },
                    value: 'Module'
                }, {
                    attribute: {
                        code: 'isLineListService',
                        name: 'Is Linelist Service'
                    },
                    value: 'false'
                }],
                parent: {
                    name: "Par1",
                    id: 'par1'
                }
            }];

            expect(orgUnitRepo.upsert).toHaveBeenCalledWith(expectedModules);

            var expectedPayload = [{
                name: 'module NEW name',
                shortName: 'module NEW name',
                id: 'mod2',
                level: 6,
                openingDate: '2014-04-01',
                selectedDataset: undefined,
                datasets: [{
                    sections: [{
                        dataElements: [{
                            id: '1',
                            isIncluded: false
                        }, {
                            id: '2',
                            isIncluded: true
                        }, {
                            id: '3',
                            isIncluded: false
                        }]
                    }]
                }],
                enrichedProgram: undefined,
                attributeValues: [{
                    attribute: {
                        code: 'Type',
                        name: 'Type'
                    },
                    value: 'Module'
                }, {
                    attribute: {
                        code: 'isLineListService',
                        name: 'Is Linelist Service'
                    },
                    value: 'false'
                }],
                parent: {
                    name: 'Par1',
                    id: 'par1'
                }
            }];

            expect(hustle.publish).toHaveBeenCalledWith({
                data: expectedPayload,
                type: "upsertOrgUnit"
            }, "dataValues");

        });

        it("should return false if datasets for modules are selected", function() {
            var modules = [{
                'name': "Module1",
                'serviceType': "Aggregate",
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
                'datasets': [],
                'serviceType': "Aggregate"
            }];

            expect(scope.areDatasetsNotSelected(modules)).toEqual(true);
        });

        it("should return false if program for module is selected", function() {
            var modules = [{
                'name': "Module1",
                'program': {
                    "name": "ER Linelist"
                },
                'serviceType': "Linelist"
            }];

            expect(scope.areNoProgramsSelected(modules)).toEqual(false);
        });

        it("should return true if no program for module is selected", function() {
            var modules = [{
                'name': "Module1",
                'program': {
                    "name": ""
                },
                'serviceType': "Linelist"
            }];

            expect(scope.areNoProgramsSelected(modules)).toEqual(true);
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
            var timestamp = "2014-2-23";
            var module = {
                "id": "mod1",
                "timestamp": timestamp
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
            expect(scope.isExpanded[timestamp].Id1).toEqual(true);
            expect(scope.isExpanded[timestamp].Id2).toEqual(false);
        });

        it("should return true if no section is selected from each dataset", function() {
            var module = {
                'serviceType': "Aggregate",
                'datasets': [{
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
                'serviceType': "Aggregate",
                'datasets': [{
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
                        name: 'Is Disabled'
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
            expect(scope.$parent.closeNewForm).toHaveBeenCalledWith(module, "disabledModule");
            expect(scope.isDisabled).toEqual(true);
        });

        it("should load current datasets for a module if dataModelType is current", function() {
            var module = {
                'id': "Mod1",
                'name': "Module1"
            };

            scope.allDatasets = [{
                'id': 'ds1',
                'name': 'Neonat',
                'attributeValues': [{
                    "attribute": {
                        "code": 'isNewDataModel'
                    },
                    "value": "true"
                }]
            }, {
                'id': 'ds2',
                'name': 'NeoNat = V1',
                'attributeValues': [{
                    "attribute": {
                        "code": 'isNewDataModel'
                    },
                    "value": "false"
                }]
            }];

            scope.changeDataModel(module, "Current");
            scope.$apply();

            expect(module.allDatasets).toEqual([{
                'id': 'ds2',
                'name': 'NeoNat = V1',
                'attributeValues': [{
                    "attribute": {
                        "code": 'isNewDataModel'
                    },
                    "value": "false"
                }]
            }]);
        });

        it("should load current datasets for a module if dataModelType is new", function() {
            var module = {
                'id': "Mod1",
                'name': "Module1"
            };

            scope.allDatasets = [{
                'id': 'ds1',
                'name': 'Neonat',
                'attributeValues': [{
                    "attribute": {
                        "code": 'isNewDataModel'
                    },
                    "value": "true"
                }]
            }, {
                'id': 'ds2',
                'name': 'NeoNat = V1',
                'attributeValues': [{
                    "attribute": {
                        "code": 'isNewDataModel'
                    },
                    "value": "false"
                }]
            }];

            scope.changeDataModel(module, "New");
            scope.$apply();

            expect(module.allDatasets).toEqual([{
                'id': 'ds1',
                'name': 'Neonat',
                'attributeValues': [{
                    "attribute": {
                        "code": 'isNewDataModel'
                    },
                    "value": "true"
                }]
            }]);
        });

        it("should set program on scope", function() {
            var program = {
                "id": "surgery1",
                "name": "Surgery",
                "programStages": [{
                    "programStageSections": [{
                        "id": "sectionId",
                        "programStageDataElements": [{
                            "dataElement": {
                                "id": "de1"
                            }
                        }]
                    }]
                }]
            };

            var module1 = {
                "id": "mod1",
                "program": {
                    "id": "surgery1",
                    "name": "Surgery"
                }
            };

            var expectedModule = {
                "id": "mod1",
                "program": {
                    "id": "surgery1",
                    "name": "Surgery"
                },
                "enrichedProgram": {
                    "id": "surgery1",
                    "name": "Surgery",
                    "programStages": [{
                        "programStageSections": [{
                            "id": "sectionId",
                            "programStageDataElements": [{
                                "dataElement": {
                                    "id": "de1",
                                    "isIncluded": true
                                }
                            }]
                        }]
                    }]
                }
            };

            spyOn(programsRepo, "getProgramAndStages").and.returnValue(utils.getPromise(q, program));

            scope.getDetailedProgram(module1).then(function(data) {
                expect(data).toEqual(expectedModule);
                expect(scope.collapseSection).toEqual({
                    sectionId: false
                });
            });

            scope.$apply();
        });

        it("should change collapsed", function() {
            scope.collapseSection = {
                "sectionId": true
            };

            scope.changeCollapsed("sectionId");
            scope.$apply();

            expect(scope.collapseSection.sectionId).toEqual(false);
        });

        it("should get collapsed for a section", function() {
            scope.collapseSection = {
                "sectionId": true
            };

            expect(scope.getCollapsed("sectionId")).toEqual(true);
        });
    });
});