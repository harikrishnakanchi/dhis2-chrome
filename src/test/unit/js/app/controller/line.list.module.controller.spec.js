/*global Date:true*/
define(["lineListModuleController", "angularMocks", "utils", "testData", "orgUnitGroupHelper", "moment", "md5", "timecop", "dhisId"], function(LineListModuleController, mocks, utils, testData, OrgUnitGroupHelper, moment, md5, timecop, dhisId) {
    describe("line list module controller", function() {
        var scope, lineListModuleController, mockOrgStore, db, q, location, _Date, datasets, sections,
            dataElements, sectionsdata, dataElementsdata, orgUnitRepo, orgunitGroupRepo, hustle, systemSettingRepo, fakeModal, allPrograms, programsRepo, datasetRepo, allDatasets;

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
            orgUnitRepo = utils.getMockRepo(q);
            orgunitGroupRepo = utils.getMockRepo(q);
            systemSettingRepo = utils.getMockRepo(q);
            systemSettingRepo.get = function() {};
            systemSettingRepo.upsert = function() {};
            programsRepo = utils.getMockRepo(q, allPrograms);
            programsRepo.get = function() {};
            programsRepo.getProgramForOrgUnit = function() {};

            allDatasets = [{
                "id": "ds1",
                "code": "ds1Code",
                "name": "dataSet1",
                "organisationUnits": [{
                    id: 'Module1Id',
                    name: 'Module1'
                }]
            }, {
                "id": "ds2",
                "code": "ds2Code",
                "name": "dataSet2"
            }];

            datasetRepo = utils.getMockRepo(q);
            datasetRepo.getAllLinelistDatasets = function() {};
            spyOn(datasetRepo, "getAllLinelistDatasets").and.returnValue(utils.getPromise(q, allDatasets));
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
            lineListModuleController = new LineListModuleController(scope, hustle, orgUnitRepo, systemSettingRepo, db, location, q, fakeModal, programsRepo, orgunitGroupRepo, orgUnitGroupHelper, datasetRepo);
        }));

        afterEach(function() {
            Timecop.returnToPresent();
            Timecop.uninstall();
        });

        it("should save excluded DataElement", function() {

            spyOn(programsRepo, "getProgramForOrgUnit").and.returnValue(utils.getPromise(q, program));
            spyOn(systemSettingRepo, "get").and.returnValue(utils.getPromise(q, {}));
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

            spyOn(programsRepo, "get").and.returnValue(utils.getPromise(q, program));
            spyOn(systemSettingRepo, "upsert").and.returnValue(utils.getPromise(q, {}));
            spyOn(hustle, "publish").and.returnValue(utils.getPromise(q, {}));

            scope.save();
            scope.$apply();

            expect(scope.saveFailure).toBe(false);

            var expectedSystemSettings = {
                "key": "Module2someid",
                "value": {
                    "clientLastUpdated": "2014-04-01T00:00:00.000Z",
                    "dataElements": ["de3"]
                }
            };
            expect(systemSettingRepo.upsert).toHaveBeenCalledWith(expectedSystemSettings);

            expect(hustle.publish).toHaveBeenCalledWith({
                data: expectedSystemSettings,
                type: "uploadSystemSetting"
            }, "dataValues");
        });

        it("should save linelist modules", function() {
            spyOn(programsRepo, "getProgramForOrgUnit").and.returnValue(utils.getPromise(q, undefined));
            spyOn(systemSettingRepo, "get").and.returnValue(utils.getPromise(q, {}));
            spyOn(dhisId, "get").and.callFake(function(name) {
                return name;
            });
            spyOn(systemSettingRepo, "upsert").and.returnValue(utils.getPromise(q, {}));
            spyOn(hustle, "publish").and.returnValue(utils.getPromise(q, {}));

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
                }],
                "parent": {
                    "name": "Project1",
                    "id": "someid"
                }
            };

            var datasetWithNewModule = {
                "id": "ds1",
                "code": "ds1Code",
                "name": "dataSet1",
                "organisationUnits": [{
                    id: 'Module1Id',
                    name: 'Module1'
                }, {
                    id: 'Module2someid',
                    name: 'Module2'
                }]
            };

            expect(orgUnitRepo.upsert).toHaveBeenCalledWith(newLineListModule);
            expect(hustle.publish).toHaveBeenCalledWith({
                data: newLineListModule,
                type: "upsertOrgUnit"
            }, "dataValues");

            var programWithNewOrgUnit = {
                'id': 'prog1',
                'name': 'ER Linelist',
                'attributeValues': [{
                    "attribute": {
                        "code": "associatedDataSet"
                    },
                    "value": "ds1Code"
                }],
                'organisationUnits': [{
                    id: 'Module2someid',
                    name: 'Module2'
                }]
            };

            expect(programsRepo.upsert).toHaveBeenCalledWith(programWithNewOrgUnit);
            expect(hustle.publish).toHaveBeenCalledWith({
                data: programWithNewOrgUnit,
                type: "uploadProgram"
            }, "dataValues");

            expect(datasetRepo.upsert).toHaveBeenCalledWith(datasetWithNewModule);
            expect(hustle.publish).toHaveBeenCalledWith({
                data: ["ds1"],
                type: "associateOrgUnitToDataset"
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
                    "value": true
                }]
            };
            scope.isNewMode = false;
            spyOn(programsRepo, "getProgramForOrgUnit").and.returnValue(utils.getPromise(q, program));
            spyOn(programsRepo, "get").and.returnValue(utils.getPromise(q, program));
            spyOn(systemSettingRepo, "get").and.returnValue(utils.getPromise(q, {}));
            spyOn(systemSettingRepo, "upsert").and.returnValue(utils.getPromise(q, {}));

            lineListModuleController = new LineListModuleController(scope, hustle, orgUnitRepo, systemSettingRepo, db, location, q, fakeModal, programsRepo, orgunitGroupRepo, orgUnitGroupHelper);

            scope.$apply();
            expect(scope.isDisabled).toBeTruthy();
        });

        it("should update system setting while updating module", function() {
            spyOn(programsRepo, "getProgramForOrgUnit").and.returnValue(utils.getPromise(q, {}));
            spyOn(systemSettingRepo, "get").and.returnValue(utils.getPromise(q, {}));
            scope.$apply();

            scope.isNewMode = false;
            lineListModuleController = new LineListModuleController(scope, hustle, orgUnitRepo, systemSettingRepo, db, location, q, fakeModal, programsRepo, orgunitGroupRepo, orgUnitGroupHelper);
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

            spyOn(systemSettingRepo, "upsert").and.returnValue(utils.getPromise(q, {}));
            spyOn(hustle, "publish").and.returnValue(utils.getPromise(q, {}));

            scope.update(module);
            scope.$apply();

            var expectedSystemSettings = {
                key: 'newId',
                value: {
                    "clientLastUpdated": "2014-04-01T00:00:00.000Z",
                    "dataElements": ['de3']
                }
            };
            expect(systemSettingRepo.upsert).toHaveBeenCalledWith(expectedSystemSettings);
            expect(hustle.publish.calls.argsFor(1)).toEqual([{
                data: expectedSystemSettings,
                type: "uploadSystemSetting"
            }, "dataValues"]);
        });

        it("should update module name", function() {
            spyOn(programsRepo, "getProgramForOrgUnit").and.returnValue(utils.getPromise(q, {}));
            spyOn(systemSettingRepo, "get").and.returnValue(utils.getPromise(q, {}));
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
                }],
                "parent": parent
            };

            scope.isNewMode = false;
            spyOn(systemSettingRepo, "upsert").and.returnValue(utils.getPromise(q, {}));
            spyOn(hustle, "publish").and.returnValue(utils.getPromise(q, {}));

            lineListModuleController = new LineListModuleController(scope, hustle, orgUnitRepo, systemSettingRepo, db, location, q, fakeModal, programsRepo, orgunitGroupRepo, orgUnitGroupHelper);
            scope.update(module);
            scope.$apply();

            expect(orgUnitRepo.upsert).toHaveBeenCalledWith(enrichedLineListModule);
            expect(hustle.publish).toHaveBeenCalledWith({
                data: enrichedLineListModule,
                type: "upsertOrgUnit"
            }, "dataValues");
        });

        it("should not disable save or update button if program is selected", function() {
            spyOn(programsRepo, "getProgramForOrgUnit").and.returnValue(utils.getPromise(q, {}));
            spyOn(systemSettingRepo, "get").and.returnValue(utils.getPromise(q, {}));
            scope.$apply();
            scope.program = {
                "name": "ER Linelist"
            };

            expect(scope.shouldDisableSaveOrUpdateButton()).toEqual(false);
        });

        it("should disable save or update button if program is not selected", function() {
            spyOn(programsRepo, "getProgramForOrgUnit").and.returnValue(utils.getPromise(q, {}));
            spyOn(systemSettingRepo, "get").and.returnValue(utils.getPromise(q, {}));
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
            spyOn(systemSettingRepo, "get").and.returnValue(utils.getPromise(q, {}));

            spyOn(hustle, "publish").and.callFake(function(payload) {
                disableAttrInHustle = _.find(payload.data.attributeValues, {
                    'attribute': {
                        'code': 'isDisabled'
                    }
                });
            });
            scope.isNewMode = false;

            lineListModuleController = new LineListModuleController(scope, hustle, orgUnitRepo, systemSettingRepo, db, location, q, fakeModal, programsRepo, orgunitGroupRepo, orgUnitGroupHelper);
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
            spyOn(systemSettingRepo, "get").and.returnValue(utils.getPromise(q, {}));

            scope.getEnrichedProgram("surgery1").then(function(data) {
                expect(scope.enrichedProgram).toEqual(program);
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
            spyOn(systemSettingRepo, "get").and.returnValue(utils.getPromise(q, {}));

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
