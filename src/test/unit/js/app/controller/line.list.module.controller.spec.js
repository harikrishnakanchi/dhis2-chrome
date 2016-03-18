/*global Date:true*/
define(["lineListModuleController", "angularMocks", "utils", "testData", "orgUnitGroupHelper", "moment", "timecop", "dhisId",
        "orgUnitRepository", "datasetRepository", "originOrgunitCreator", "excludedDataElementsRepository", "programRepository"
    ],
    function(LineListModuleController, mocks, utils, testData, OrgUnitGroupHelper, moment, timecop, dhisId,
        OrgUnitRepository, DatasetRepository, OriginOrgunitCreator, ExcludedDataElementsRepository, ProgramRepository) {

        describe("line list module controller", function() {
            var scope, lineListModuleController, mockOrgStore, db, q, datasets, sections,
                dataElements, sectionsdata, dataElementsdata, orgUnitRepository, hustle, excludedDataElementsRepository,
                fakeModal, allPrograms, programRepository, datasetRepository, originOrgunitCreator;

            beforeEach(module('hustle'));
            beforeEach(mocks.inject(function($rootScope, $q, $hustle) {
                scope = $rootScope.$new();
                q = $q;

                hustle = $hustle;
                spyOn(hustle, "publish").and.returnValue(utils.getPromise(q, {}));

                allPrograms = [{
                    'id': 'prog1',
                    'name': 'ER Linelist',
                    'organisationUnits': [],
                    'attributeValues': [{
                        "attribute": {
                            "code": "associatedDataSet"
                        },
                        "value": "Ds1"
                    }]
                }];

                excludedDataElementsRepository = new ExcludedDataElementsRepository();
                spyOn(excludedDataElementsRepository, "get").and.returnValue(utils.getPromise(q, {}));
                spyOn(excludedDataElementsRepository, "upsert").and.returnValue(utils.getPromise(q, {}));

                programRepository = new ProgramRepository();
                spyOn(programRepository, "get").and.returnValue(utils.getPromise(q, undefined));
                spyOn(programRepository, "getAll").and.returnValue(utils.getPromise(q, []));
                spyOn(programRepository, "getProgramForOrgUnit").and.returnValue(utils.getPromise(q, undefined));
                spyOn(programRepository, "associateOrgUnits").and.returnValue(utils.getPromise(q, []));

                originOrgunitCreator = new OriginOrgunitCreator();
                spyOn(originOrgunitCreator, "create").and.returnValue(utils.getPromise(q, {}));

                orgUnitRepository = new OrgUnitRepository();
                spyOn(orgUnitRepository, "upsert").and.returnValue(utils.getPromise(q, {}));
                spyOn(orgUnitRepository, "getAllModulesInOrgUnits").and.returnValue(utils.getPromise(q, []));
                spyOn(orgUnitRepository, "getProjectAndOpUnitAttributes").and.returnValue(utils.getPromise(q, undefined));
                spyOn(orgUnitRepository, "get").and.returnValue(utils.getPromise(q, undefined));
                spyOn(orgUnitRepository, "findAllByParent").and.returnValue(utils.getPromise(q, [{
                    "id": "originOrgUnit"
                }]));

                var allDatasets = [{
                    "id": "Ds1",
                    "isOriginDataset": false
                }, {
                    "id": "OrgDs1",
                    "isOriginDataset": true
                }];

                datasetRepository = new DatasetRepository();
                spyOn(datasetRepository, "associateOrgUnits").and.returnValue(utils.getPromise(q, {}));
                spyOn(datasetRepository, "getAll").and.returnValue(utils.getPromise(q, allDatasets));

                orgUnitGroupHelper = new OrgUnitGroupHelper();
                spyOn(orgUnitGroupHelper, "createOrgUnitGroups").and.returnValue(utils.getPromise(q, {}));

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

                scope.currentUser = {
                    "locale": "en"
                };

                scope.resourceBundle = {
                    "disableOrgUnitDesc": "disable organisation unit: ",
                    "upsertOrgUnitDesc": "save organisation unit: ",
                    "associateOrgUnitToDatasetDesc": "associate datasets for ",
                    "uploadSystemSettingDesc": "upload sys settings for ",
                    "uploadProgramDesc": "associate selected program to "
                };

                scope.isNewMode = true;
                lineListModuleController = new LineListModuleController(scope, hustle, orgUnitRepository, excludedDataElementsRepository, q, fakeModal, programRepository, orgUnitGroupHelper, datasetRepository, originOrgunitCreator);
            }));

            afterEach(function() {
                Timecop.returnToPresent();
                Timecop.uninstall();
            });

            it("should save sorted list of all programs", function() {
                var program1 = {
                    'id': 'prog1',
                    'name': 'ER Linelist',
                };
                var program2 = {
                    'id': 'prog1',
                    'name': 'Burn Unit',
                };

                programRepository.getAll.and.returnValue([program1, program2]);
                scope.$apply();
                expect(scope.allPrograms).toEqual([program2, program1]);

            });

            it("should save excluded DataElement", function() {

                programRepository.getProgramForOrgUnit.and.returnValue(utils.getPromise(q, program));
                spyOn(dhisId, "get").and.callFake(function(name) {
                    return name;
                });

                scope.$apply();
                scope.orgUnit = {
                    "name": "Project1",
                    "id": "someid",
                    "level": 3,
                    "children": []
                };
                var program = {
                    'id': 'prog1',
                    'name': 'ER Linelist',
                    'attributeValues': [{
                        "attribute": {
                            "code": "associatedDataSet"
                        },
                        "value": "ds1Code"
                    }],
                    'organisationUnits': []
                };
                scope.program = program;

                scope.module = {
                    'name': "Module2",
                    'serviceType': "Linelist",
                    'parent': scope.orgUnit
                };

                scope.enrichedProgram = {
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
                };

                programRepository.get.and.returnValue(utils.getPromise(q, program));

                scope.save();
                scope.$apply();

                expect(scope.saveFailure).toBe(false);

                expect(excludedDataElementsRepository.get).not.toHaveBeenCalled();
                var expectedExcludedDataElementsSetting = {
                    "orgUnit": "Module2someid",
                    "clientLastUpdated": "2014-04-01T00:00:00.000Z",
                    "dataElements": [{
                        "id": "de3"
                    }]
                };
                expect(excludedDataElementsRepository.upsert).toHaveBeenCalledWith(expectedExcludedDataElementsSetting);

                expect(hustle.publish).toHaveBeenCalledWith({
                    data: "Module2someid",
                    type: "uploadExcludedDataElements",
                    locale: "en",
                    desc: "upload sys settings for Module2"
                }, "dataValues");
            });

            it("should save linelist modules", function() {
                spyOn(dhisId, "get").and.callFake(function(name) {
                    return name;
                });

                var today = new Date();

                var selectOrgUnit = function() {
                    scope.orgUnit = {
                        "name": "Project1",
                        "id": "someid",
                        "children": [],
                        "level": 3
                    };
                    scope.$apply();
                };

                var fillNewModuleForm = function() {
                    scope.module = {
                        'name': "Module2",
                        'openingDate': today,
                        'serviceType': "Linelist",
                        'parent': scope.orgUnit
                    };
                };

                var selectProgram = function() {
                    scope.program = {
                        'id': 'prog1',
                        'name': 'ER Linelist',
                        'attributeValues': [{
                            "attribute": {
                                "code": "associatedDataSet"
                            },
                            "value": "ds1Code"
                        }]
                    };
                    scope.$apply();
                };

                selectOrgUnit();
                fillNewModuleForm();
                selectProgram();

                scope.save();
                scope.$apply();

                var newLineListModule = {
                    "name": "Module2",
                    "shortName": "Module2",
                    "displayName": "Project1 - Module2",
                    "id": "Module2someid",
                    "level": 4,
                    "openingDate": today,
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
                    }, {
                        "created": moment().toISOString(),
                        "lastUpdated": moment().toISOString(),
                        "attribute": {
                            "code": 'isNewDataModel',
                            "name": "Is New Data Model"
                        },
                        "value": 'true'
                    }],
                    "parent": {
                        "name": "Project1",
                        "id": "someid"
                    }
                };

                expect(orgUnitRepository.upsert).toHaveBeenCalledWith(newLineListModule);
                expect(hustle.publish).toHaveBeenCalledWith({
                    data: newLineListModule,
                    type: "upsertOrgUnit",
                    locale: "en",
                    desc: "save organisation unit: Module2"
                }, "dataValues");

                expect(scope.saveFailure).toBe(false);
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
                        "value": "true"
                    }]
                };
                scope.isNewMode = false;
                programRepository.getProgramForOrgUnit.and.returnValue(utils.getPromise(q, program));
                programRepository.get.and.returnValue(utils.getPromise(q, program));

                lineListModuleController = new LineListModuleController(scope, hustle, orgUnitRepository, excludedDataElementsRepository, q, fakeModal, programRepository, orgUnitGroupHelper, datasetRepository, originOrgunitCreator);

                scope.$apply();
                expect(scope.isDisabled).toBeTruthy();
            });

            it("should update system setting while updating module", function() {
                scope.$apply();

                scope.isNewMode = false;
                lineListModuleController = new LineListModuleController(scope, hustle, orgUnitRepository, excludedDataElementsRepository, q, fakeModal, programRepository, orgUnitGroupHelper, datasetRepository, originOrgunitCreator);
                var parent = {
                    "id": "par1",
                    "name": "Par1"
                };

                scope.program = {
                    'id': 'prog1',
                    'name': 'ER Linelist',
                    'organisationUnits': []
                };
                scope.enrichedProgram = {
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
                };

                var module = {
                    'name': "module NEW name",
                    'id': "newId",
                    'serviceType': "Linelist",
                    'parent': parent
                };


                scope.update(module);
                scope.$apply();

                var expectedExcludedDataElementsSetting = {
                    "orgUnit": "newId",
                    "clientLastUpdated": "2014-04-01T00:00:00.000Z",
                    "dataElements": [{
                        'id': 'de3'
                    }]
                };
                expect(excludedDataElementsRepository.upsert).toHaveBeenCalledWith(expectedExcludedDataElementsSetting);
                expect(hustle.publish.calls.argsFor(1)).toEqual([{
                    data: "newId",
                    type: "uploadExcludedDataElements",
                    locale: "en",
                    desc: "upload sys settings for module NEW name"
                }, "dataValues"]);
            });

            it("should update module name", function() {
                scope.$apply();

                var oldid = "oldid";
                var parent = {
                    "id": "par1",
                    "name": "Par1"
                };

                var module = {
                    'name': "new name",
                    'id': oldid,
                    'openingDate': new Date(),
                    'serviceType': "Linelist",
                    'parent': parent
                };

                var enrichedLineListModule = {
                    "name": "new name",
                    "shortName": "new name",
                    "displayName": "Par1 - new name",
                    "id": oldid,
                    "level": 6,
                    "openingDate": moment(new Date()).toDate(),
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
                    }, {
                        "created": moment().toISOString(),
                        "lastUpdated": moment().toISOString(),
                        "attribute": {
                            "code": 'isNewDataModel',
                            "name": "Is New Data Model"
                        },
                        "value": 'true'
                    }],
                    "parent": parent
                };

                scope.isNewMode = false;

                lineListModuleController = new LineListModuleController(scope, hustle, orgUnitRepository, excludedDataElementsRepository, q, fakeModal, programRepository, orgUnitGroupHelper, datasetRepository, originOrgunitCreator);
                scope.update(module);
                scope.$apply();

                expect(orgUnitRepository.upsert).toHaveBeenCalledWith(enrichedLineListModule);
                expect(hustle.publish).toHaveBeenCalledWith({
                    data: enrichedLineListModule,
                    type: "upsertOrgUnit",
                    locale: "en",
                    desc: "save organisation unit: new name"
                }, "dataValues");
            });

            it("should not disable save or update button if program is selected", function() {
                scope.$apply();
                scope.program = {
                    "name": "ER Linelist"
                };

                expect(scope.shouldDisableSaveOrUpdateButton()).toEqual(false);
            });

            it("should disable save or update button if program is not selected", function() {
                scope.$apply();
                scope.program = {
                    "name": ""
                };

                expect(scope.shouldDisableSaveOrUpdateButton()).toEqual(true);
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
                orgUnitRepository.upsert = {};
                spyOn(orgUnitRepository, 'upsert').and.callFake(function(payload) {
                    disablesAttInDb = _.find(payload.attributeValues, {
                        'attribute': {
                            'code': 'isDisabled'
                        }
                    });
                });

                hustle.publish.and.callFake(function(payload) {
                    disableAttrInHustle = _.find(payload.data.attributeValues, {
                        'attribute': {
                            'code': 'isDisabled'
                        }
                    });
                });
                scope.isNewMode = false;

                lineListModuleController = new LineListModuleController(scope, hustle, orgUnitRepository, excludedDataElementsRepository, q, fakeModal, programRepository, orgUnitGroupHelper, datasetRepository, originOrgunitCreator);
                scope.disable(module);
                scope.$apply();

                expect(disablesAttInDb.value).toEqual("true");
                expect(disableAttrInHustle.value).toEqual("true");
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

                var selectedObject = {
                    "originalObject": program
                };

                programRepository.getProgramForOrgUnit.and.returnValue(utils.getPromise(q, program));
                programRepository.get.and.returnValue(utils.getPromise(q, program));

                scope.onProgramSelect(selectedObject).then(function(data) {
                    expect(scope.enrichedProgram).toEqual(program);
                    expect(scope.collapseSection).toEqual({
                        sectionId1: false,
                        sectionId2: true
                    });
                });

                scope.$apply();
            });

            it("should set program to blank on scope when the program name is cleared on the form", function() {

                scope.onProgramSelect();
                expect(scope.program).toEqual({});
                expect(programRepository.get).not.toHaveBeenCalled();

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

            it("should create origin org units", function() {
                var today = new Date();
                scope.$apply();

                scope.module = {
                    'id': "Module2",
                    'name': "Module2",
                    'openingDate': today,
                    'serviceType': "Linelist",
                    'parent': scope.orgUnit
                };

                var program = {
                    'id': 'prog1',
                    'name': 'ER Linelist',
                    'attributeValues': [{
                        "attribute": {
                            "code": "associatedDataSet"
                        },
                        "value": "ds1Code"
                    }]
                };

                var enrichedModule = {
                    "name": "Module2",
                    "shortName": "Module2",
                    "displayName": "SomeName - Module2",
                    "id": "Module2someId",
                    "level": NaN,
                    "openingDate": moment().toDate(),
                    "attributeValues": [{
                        "created": "2014-04-01T00:00:00.000Z",
                        "lastUpdated": "2014-04-01T00:00:00.000Z",
                        "attribute": {
                            "code": "Type",
                            "name": "Type"
                        },
                        "value": "Module"
                    }, {
                        "created": "2014-04-01T00:00:00.000Z",
                        "lastUpdated": "2014-04-01T00:00:00.000Z",
                        "attribute": {
                            "code": "isLineListService",
                            "name": "Is Linelist Service"
                        },
                        "value": "true"
                    }, {
                        "created": "2014-04-01T00:00:00.000Z",
                        "lastUpdated": "2014-04-01T00:00:00.000Z",
                        "attribute": {
                            "code": 'isNewDataModel',
                            "name": "Is New Data Model"
                        },
                        "value": 'true'
                    }],
                    "parent": {
                        "name": "SomeName",
                        "id": "someId"
                    }
                };

                var originOrgUnit = [{
                    "id": "ou1",
                    "name": "origin org unit"
                }];

                spyOn(dhisId, "get").and.callFake(function(name) {
                    return name;
                });

                originOrgunitCreator.create.and.returnValue(utils.getPromise(q, originOrgUnit));

                scope.program = program;
                programRepository.get.and.returnValue(utils.getPromise(q, program));

                scope.save();
                scope.$apply();

                expect(originOrgunitCreator.create).toHaveBeenCalledWith(enrichedModule);
                expect(hustle.publish.calls.count()).toEqual(5);
                expect(hustle.publish.calls.argsFor(2)).toEqual([{
                    "data": originOrgUnit,
                    "type": "upsertOrgUnit",
                    "locale": "en",
                    "desc": "save organisation unit: origin org unit"
                }, "dataValues"]);
            });

            it("should associate origin org units to programs and datasets and publish jobs accordingly", function() {
                var today = new Date();
                scope.$apply();

                scope.module = {
                    'id': "Module2",
                    'name': "Module2",
                    'openingDate': today,
                    'serviceType': "Linelist",
                    'parent': scope.orgUnit
                };

                var program = {
                    'id': 'prog1',
                    'name': 'ER Linelist',
                    'organisationUnits': [],
                    'attributeValues': [{
                        "attribute": {
                            "code": "associatedDataSet"
                        },
                        "value": "Ds1"
                    }]
                };

                var patientOrigins = {
                    "origins": [{
                        "id": "id",
                        "name": "Unknown"
                    }]
                };

                var originOrgUnit = [{
                    "name": "Unknown",
                    "shortName": "Unknown",
                    "displayName": "Unknown",
                    "id": "UnknownModule2someId",
                    "level": 7,
                    "openingDate": moment().toDate(),
                    "attributeValues": [{
                        "attribute": {
                            "code": "Type",
                            "name": "Type"
                        },
                        "value": "Patient Origin"
                    }],
                    "parent": {
                        "id": "Module2someId"
                    }
                }];

                spyOn(dhisId, "get").and.callFake(function(name) {
                    return name;
                });

                programRepository.getProgramForOrgUnit.and.returnValue(utils.getPromise(q, program));
                originOrgunitCreator.create.and.returnValue(utils.getPromise(q, originOrgUnit));

                scope.program = program;
                programRepository.get.and.returnValue(utils.getPromise(q, program));

                scope.save();
                scope.$apply();

                expect(programRepository.associateOrgUnits).toHaveBeenCalledWith(program, originOrgUnit);
                expect(datasetRepository.associateOrgUnits).toHaveBeenCalledWith(["Ds1", "OrgDs1"], originOrgUnit);
                expect(hustle.publish.calls.argsFor(3)).toEqual([{
                    data: program,
                    type: "uploadProgram",
                    locale: "en",
                    desc: "associate selected program to Unknown"
                }, "dataValues"]);

                expect(hustle.publish.calls.argsFor(4)).toEqual([{
                    data: {"orgUnitIds":["UnknownModule2someId"], "dataSetIds":["Ds1", "OrgDs1"]},
                    type: "associateOrgUnitToDataset",
                    locale: "en",
                    desc: "associate datasets for SomeName"
                }, "dataValues"]);

            });

            it("should create org unit groups", function() {
                var today = new Date();
                scope.$apply();

                scope.module = {
                    'id': "Module2",
                    'name': "Module2",
                    'openingDate': today,
                    'serviceType': "Linelist",
                    'parent': scope.orgUnit,
                    "attributeValues": [{
                        "attribute": {
                            "code": "associatedDataSet"
                        },
                        "value": ""
                    }],
                };

                var program = {
                    'id': 'prog1',
                    'name': 'ER Linelist',
                    'organisationUnits': [],
                    'attributeValues': [{
                        "attribute": {
                            "code": "associatedDataSet"
                        },
                        "value": "ds1Code"
                    }]
                };

                var patientOrigins = {
                    "origins": [{
                        "id": "id",
                        "name": "Unknown"
                    }]
                };

                var originOrgUnit = [{
                    "name": "Unknown",
                    "shortName": "Unknown",
                    "displayName": "Unknown",
                    "id": "UnknownModule2someId",
                    "level": 7,
                    "openingDate": moment().toDate(),
                    "attributeValues": [{
                        "attribute": {
                            "code": "Type",
                            "name": "Type"
                        },
                        "value": "Patient Origin"
                    }],
                    "parent": {
                        "id": "Module2someId"
                    }
                }];

                spyOn(dhisId, "get").and.callFake(function(name) {
                    return name;
                });

                programRepository.getProgramForOrgUnit.and.returnValue(utils.getPromise(q, program));
                originOrgunitCreator.create.and.returnValue(utils.getPromise(q, originOrgUnit));

                scope.program = program;
                programRepository.get.and.returnValue(utils.getPromise(q, program));

                scope.save();
                scope.$apply();

                expect(orgUnitGroupHelper.createOrgUnitGroups).toHaveBeenCalledWith(originOrgUnit, false);
            });

            it("should take the user to the view page of the parent opUnit on clicking cancel", function() {
                scope.orgUnit = {
                    "id": "parent",
                    "name": "parent"
                };

                scope.$parent = {
                    "closeNewForm": function() {}
                };

                spyOn(scope.$parent, "closeNewForm").and.callFake(function(parentOrgUnit) {
                    return;
                });

                scope.closeForm();

                expect(scope.$parent.closeNewForm).toHaveBeenCalledWith(scope.orgUnit);
            });
        });
    });
