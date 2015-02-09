/*global Date:true*/
define(["lineListModuleController", "angularMocks", "utils", "testData", "orgUnitGroupHelper", "moment", "md5", "timecop"], function(LineListModuleController, mocks, utils, testData, OrgUnitGroupHelper, moment, md5, timecop) {
    describe("line list module controller", function() {
        var scope, lineListModuleController, orgUnitService, mockOrgStore, db, q, location, _Date, datasets, sections,
            dataElements, sectionsdata, dataElementsdata, orgUnitRepo, orgunitGroupRepo, hustle, systemSettingRepo, fakeModal, allPrograms, programsRepo;

        beforeEach(module('hustle'));
        beforeEach(mocks.inject(function($rootScope, $q, $hustle, $location) {
            scope = $rootScope.$new();
            q = $q;
            hustle = $hustle;

            allPrograms = [{
                'id': 'prog1',
                'name': 'ER Linelist',
                'organisationUnits': []
            }];

            location = $location;

            orgUnitService = {
                "getAssociatedDatasets": function() {},
            };

            orgUnitRepo = utils.getMockRepo(q);
            orgunitGroupRepo = utils.getMockRepo(q);
            systemSettingRepo = utils.getMockRepo(q);
            systemSettingRepo.getAllWithProjectId = function() {};
            systemSettingRepo.upsert = function() {};
            programsRepo = utils.getMockRepo(q, allPrograms);
            programsRepo.get = function() {};
            programsRepo.getProgramForOrgUnit = function() {};
            orgUnitGroupHelper = new OrgUnitGroupHelper(hustle, q, scope, orgUnitRepo, orgunitGroupRepo);

            mockOrgStore = {
                upsert: function() {},
                getAll: function() {}
            };

            db = {
                objectStore: function() {}
            };

            Timecop.install();
            Timecop.freeze(new Date("2014-04-01T00:00:00.000Z"));


            fakeModal = {
                close: function() {
                    this.result.confirmCallBack();
                },
                dismiss: function(type) {
                    this.result.cancelCallback(type);
                },
                open: function(object) {}
            };

            scope.orgUnit = {
                'name': 'SomeName',
                'id': 'someId',
                "parent": {
                    "id": "blah1"
                }
            };
            scope.isNewMode = true;
            lineListModuleController = new LineListModuleController(scope, hustle, orgUnitService, orgUnitRepo, systemSettingRepo, db, location, q, fakeModal, programsRepo, orgunitGroupRepo, orgUnitGroupHelper);
        }));

        afterEach(function() {
            Timecop.returnToPresent();
            Timecop.uninstall();
        });

        it("should save exclude DataElement", function() {
            scope.orgUnit = {
                "name": "Project1",
                "id": "someid",
                "children": []
            };
            var program = {
                'id': 'prog1',
                'name': 'ER Linelist',
                'organisationUnits': []
            };
            var linelistModule = {
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
                'program': program,
                'parent': scope.orgUnit
            };
            var data = {
                "key": "someid",
                "value": {
                    "excludedDataElements": {
                        "module3": ["de3", "de4"],
                        "adba40b7157": ["de4"]
                    }
                }
            };

            spyOn(programsRepo, "getProgramForOrgUnit").and.returnValue(utils.getPromise(q, program));
            spyOn(programsRepo, "get").and.returnValue(utils.getPromise(q, program));
            spyOn(systemSettingRepo, "getAllWithProjectId").and.returnValue(utils.getPromise(q, data));
            spyOn(systemSettingRepo, "upsert").and.returnValue(utils.getPromise(q, {}));
            spyOn(hustle, "publish").and.returnValue(utils.getPromise(q, {}));

            scope.save(linelistModule);
            scope.$apply();

            expect(scope.saveFailure).toBe(false);
            expect(systemSettingRepo.getAllWithProjectId).toHaveBeenCalledWith("someid");

            var expectedSystemSettingsPayload = {
                "projectId": "someid",
                "settings": {
                    "excludedDataElements": {
                        "module3": ["de3", "de4"],
                        "adba40b7157": ["de4"],
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

            var module = {
                'name': "Module2",
                'openingDate': new Date(),
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
                },
                'parent': scope.orgUnit

            };

            var enrichedLineListModules = [{
                "name": "Module2",
                "shortName": "Module2",
                "id": "a1ab18b5fdd",
                "level": NaN,
                "openingDate": moment(new Date()).toDate(),
                "selectedDataset": undefined,
                "associatedDatasets": undefined,
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
                    "created": moment().toISOString(),
                    "lastUpdated": moment().toISOString(),
                    "attribute": {
                        "code": "Type",
                        "name": "Type"
                    },
                    "value": "Module"
                }, {
                    "created": moment().toISOString(),
                    "lastUpdated": moment().toISOString(),
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

            var program = {
                'id': 'prog1',
                'name': 'ER Linelist',
                'organisationUnits': [{
                    id: 'a1ab18b5fdd',
                    name: 'Module2'
                }]
            };

            spyOn(programsRepo, "getProgramForOrgUnit").and.returnValue(utils.getPromise(q, program));
            spyOn(programsRepo, "get").and.returnValue(utils.getPromise(q, program));
            spyOn(systemSettingRepo, "getAllWithProjectId").and.returnValue(utils.getPromise(q, {}));
            spyOn(systemSettingRepo, "upsert").and.returnValue(utils.getPromise(q, {}));
            spyOn(hustle, "publish").and.returnValue(utils.getPromise(q, {}));

            scope.save(module);
            scope.$apply();

            expect(scope.saveFailure).toBe(false);
            expect(orgUnitRepo.upsert).toHaveBeenCalledWith(enrichedLineListModules);

            expect(hustle.publish).toHaveBeenCalledWith({
                data: enrichedLineListModules,
                type: "upsertOrgUnit"
            }, "dataValues");

            expect(programsRepo.upsert).toHaveBeenCalledWith(program);
            expect(hustle.publish).toHaveBeenCalledWith({
                data: program,
                type: "uploadProgram"
            }, "dataValues");
        });

        it("should disable update and diable if orgunit is disabled", function() {
            var program = {
                'id': 'prog1',
                'name': 'ER Linelist',
                'organisationUnits': []
            };
            scope.orgUnit = {
                "id": "mod2",
                "parent": {
                    "id": "par1"
                },
                "associatedDatasets": [{
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
            spyOn(programsRepo, "getProgramForOrgUnit").and.returnValue(utils.getPromise(q, program));
            spyOn(programsRepo, "get").and.returnValue(utils.getPromise(q, program));
            spyOn(systemSettingRepo, "getAllWithProjectId").and.returnValue(utils.getPromise(q, {}));
            spyOn(systemSettingRepo, "upsert").and.returnValue(utils.getPromise(q, {}));

            lineListModuleController = new LineListModuleController(scope, hustle, orgUnitService, orgUnitRepo, systemSettingRepo, db, location, q, fakeModal, programsRepo, orgunitGroupRepo, orgUnitGroupHelper);

            scope.$apply();
            expect(scope.isDisabled).toBeTruthy();
        });

        it("should update system setting while updating module", function() {
            scope.isNewMode = false;
            lineListModuleController = new LineListModuleController(scope, hustle, orgUnitService, orgUnitRepo, systemSettingRepo, db, location, q, fakeModal, programsRepo, orgunitGroupRepo, orgUnitGroupHelper);
            var parent = {
                "id": "par1",
                "name": "Par1"
            };
            scope.orgUnit = {
                "id": "mod2",
                "name": "module OLD name",
                "parent": parent
            };
            var program = {
                'id': 'prog1',
                'name': 'ER Linelist',
                'organisationUnits': []
            };
            var module = {
                'name': "module NEW name",
                'id': "newId",
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
                'program': program,
                'parent': parent
            };

            spyOn(programsRepo, "getProgramForOrgUnit").and.returnValue(utils.getPromise(q, program));
            spyOn(programsRepo, "get").and.returnValue(utils.getPromise(q, program));
            spyOn(systemSettingRepo, "getAllWithProjectId").and.returnValue(utils.getPromise(q, {}));
            spyOn(systemSettingRepo, "upsert").and.returnValue(utils.getPromise(q, {}));
            spyOn(hustle, "publish").and.returnValue(utils.getPromise(q, {}));

            scope.update(module);
            scope.$apply();

            expect(systemSettingRepo.getAllWithProjectId).toHaveBeenCalledWith("par1");

            var expectedSystemSettingsPayload = {
                projectId: 'par1',
                settings: {
                    excludedDataElements: {
                        "newId": ['de3']
                    }
                }
            };
            expect(systemSettingRepo.upsert).toHaveBeenCalledWith(expectedSystemSettingsPayload);

            var hustlePayload = {
                "projectId": "par1",
                "settings": {
                    "excludedDataElements": {
                        "newId": ['de3']
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
            var oldid = "oldid";
            var parent = {
                "id": "par1",
                "name": "Par1"
            };
            scope.orgUnit = {
                "id": oldid,
                "name": "module OLD name",
                "parent": parent
            };
            var program = {
                'id': 'prog1',
                'name': 'ER Linelist',
                'organisationUnits': []
            };
            var module = {
                'name': "new name",
                'id': oldid,
                'openingDate': new Date(),
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
                },
                'parent': parent
            };

            var enrichedLineListModules = [{
                "name": "new name",
                "shortName": "new name",
                "id": oldid,
                "level": 6,
                "openingDate": moment(new Date()).toDate(),
                "selectedDataset": undefined,
                "associatedDatasets": undefined,
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
                    "created": moment().toISOString(),
                    "lastUpdated": moment().toISOString(),
                    "attribute": {
                        "code": "Type",
                        "name": "Type"
                    },
                    "value": "Module"
                }, {
                    "created": moment().toISOString(),
                    "lastUpdated": moment().toISOString(),
                    "attribute": {
                        "code": "isLineListService",
                        "name": "Is Linelist Service"
                    },
                    "value": "true"
                }],
                "parent": {
                    "name": "Par1",
                    "id": "par1"
                }
            }];

            scope.isNewMode = false;
            spyOn(programsRepo, "getProgramForOrgUnit").and.returnValue(utils.getPromise(q, program));
            spyOn(programsRepo, "get").and.returnValue(utils.getPromise(q, program));
            spyOn(systemSettingRepo, "getAllWithProjectId").and.returnValue(utils.getPromise(q, {}));
            spyOn(systemSettingRepo, "upsert").and.returnValue(utils.getPromise(q, {}));
            spyOn(hustle, "publish").and.returnValue(utils.getPromise(q, {}));

            lineListModuleController = new LineListModuleController(scope, hustle, orgUnitService, orgUnitRepo, systemSettingRepo, db, location, q, fakeModal, programsRepo, orgunitGroupRepo, orgUnitGroupHelper);
            scope.update(module);
            scope.$apply();

            expect(orgUnitRepo.upsert).toHaveBeenCalledWith(enrichedLineListModules);
            expect(hustle.publish).toHaveBeenCalledWith({
                data: enrichedLineListModules,
                type: "upsertOrgUnit"
            }, "dataValues");
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

        it("should disable modules", function() {
            var disableAttrInHustle = {};
            var disablesAttInDb = {};


            var parent = {
                "id": "par1",
                "name": "Par1"
            };

            scope.orgUnit = {
                "id": "projectId",
                "name": "test1",
                "parent": parent
            };
            scope.$parent.closeNewForm = jasmine.createSpy();
            scope.resourceBundle = {};
            var module = {
                name: "test1",
                id: "projectId",
                openingDate: new Date(),
                serviceType: "Linelist",
                attributeValues: [],
                parent: parent
            };

            spyOn(fakeModal, "open").and.returnValue({
                result: utils.getPromise(q, {})
            });
            orgUnitRepo.upsert = {};
            spyOn(orgUnitRepo, 'upsert').and.callFake(function(payload) {
                disablesAttInDb = _.find(payload.attributeValues, {
                    'attribute': {
                        'code': 'isDisabled'
                    }
                });
            });

            spyOn(programsRepo, "getProgramForOrgUnit").and.returnValue(utils.getPromise(q, {}));
            spyOn(programsRepo, "get").and.returnValue(utils.getPromise(q, {}));
            spyOn(systemSettingRepo, "getAllWithProjectId").and.returnValue(utils.getPromise(q, {}));

            spyOn(hustle, "publish").and.callFake(function(payload) {
                disableAttrInHustle = _.find(payload.data.attributeValues, {
                    'attribute': {
                        'code': 'isDisabled'
                    }
                });
            });
            scope.isNewMode = false;

            lineListModuleController = new LineListModuleController(scope, hustle, orgUnitService, orgUnitRepo, systemSettingRepo, db, location, q, fakeModal, programsRepo, orgunitGroupRepo, orgUnitGroupHelper);
            scope.disable(module);
            scope.$apply();

            expect(disablesAttInDb.value).toEqual(true);
            expect(disableAttrInHustle.value).toEqual(true);
            expect(scope.$parent.closeNewForm).toHaveBeenCalledWith(module, "disabledModule");
        });

        it("should set program on scope", function() {
            var program = {
                "id": "surgery1",
                "name": "Surgery",
                "programStages": [{
                    "programStageSections": [{
                        "id": "sectionId1",
                        "programStageDataElements": [{
                            "dataElement": {
                                "id": "de1"
                            }
                        }]
                    }, {
                        "id": "sectionId2",
                        "programStageDataElements": [{
                            "dataElement": {
                                "id": "de2"
                            }
                        }]
                    }]
                }]
            };

            spyOn(programsRepo, "getProgramForOrgUnit").and.returnValue(utils.getPromise(q, program));
            spyOn(programsRepo, "get").and.returnValue(utils.getPromise(q, program));
            spyOn(systemSettingRepo, "getAllWithProjectId").and.returnValue(utils.getPromise(q, {}));

            scope.getEnrichedProgram("surgery1").then(function(data) {
                expect(scope.module.enrichedProgram).toEqual(program);
                expect(scope.collapseSection).toEqual({
                    sectionId1: false,
                    sectionId2: true
                });
            });

            scope.$apply();
        });

        it("should change collapsed", function() {
            scope.collapseSection = {
                "sectionId": true
            };

            spyOn(programsRepo, "getProgramForOrgUnit").and.returnValue(utils.getPromise(q, {}));
            scope.changeCollapsed("sectionId");
            spyOn(systemSettingRepo, "getAllWithProjectId").and.returnValue(utils.getPromise(q, {}));

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
