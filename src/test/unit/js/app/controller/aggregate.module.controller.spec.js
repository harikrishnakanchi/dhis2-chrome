/*global Date:true*/
define(["aggregateModuleController", "angularMocks", "utils", "testData", "orgUnitGroupHelper", "moment", "timecop", "dhisId", "datasetRepository",
        "orgUnitRepository", "originOrgunitCreator"
    ],
    function(AggregateModuleController, mocks, utils, testData, OrgUnitGroupHelper, moment, timecop, dhisId, DatasetRepository,
        OrgUnitRepository, OriginOrgunitCreator) {

        describe("aggregate module controller", function() {
            var scope, aggregateModuleController, mockOrgStore, db, q, location, datasetsdata, orgUnitRepo, orgunitGroupRepo, hustle,
                dataSetRepo, systemSettingRepo, fakeModal, allPrograms, originOrgunitCreator;

            beforeEach(module('hustle'));
            beforeEach(mocks.inject(function($rootScope, $q, $hustle, $location) {
                scope = $rootScope.$new();
                q = $q;
                hustle = $hustle;
                spyOn(hustle, "publish").and.returnValue(utils.getPromise(q, {}));

                location = $location;

                orgUnitRepo = new OrgUnitRepository();
                orgunitGroupRepo = utils.getMockRepo(q);
                dataSetRepo = utils.getMockRepo(q);
                datasetsdata = testData.get("dataSets");

                spyOn(orgUnitRepo, "upsert").and.returnValue(utils.getPromise(q, {}));
                spyOn(orgUnitRepo, "getAllModulesInOrgUnits").and.returnValue(utils.getPromise(q, {}));
                spyOn(orgUnitRepo, "getProjectAndOpUnitAttributes").and.returnValue(utils.getPromise(q, {}));
                spyOn(orgUnitRepo, "get").and.returnValue(utils.getPromise(q, {}));

                originOrgunitCreator = new OriginOrgunitCreator();
                spyOn(originOrgunitCreator, "create").and.returnValue(utils.getPromise(q, {}));

                dataSetRepo = new DatasetRepository();
                spyOn(dataSetRepo, "getAllAggregateDatasets").and.returnValue(utils.getPromise(q, datasetsdata));
                spyOn(dataSetRepo, "getOriginDatasets").and.returnValue(utils.getPromise(q, []));
                spyOn(dataSetRepo, "associateOrgUnits").and.returnValue(utils.getPromise(q, []));
                spyOn(dataSetRepo, "getEnriched");

                systemSettingRepo = utils.getMockRepo(q);
                systemSettingRepo.get = function() {};

                orgUnitGroupHelper = new OrgUnitGroupHelper(hustle, q, scope, orgUnitRepo, orgunitGroupRepo);
                spyOn(orgUnitGroupHelper, "createOrgUnitGroups");

                mockOrgStore = {
                    upsert: function() {},
                    getAll: function() {}
                };

                db = {
                    objectStore: function() {}
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
                    "uploadSystemSettingDesc": "upload sys settings for "
                };

                scope.isNewMode = true;

                Timecop.install();
                Timecop.freeze(new Date("2014-04-01T00:00:00.000Z"));

                aggregateModuleController = new AggregateModuleController(scope, hustle, orgUnitRepo, dataSetRepo, systemSettingRepo, db, location, q, fakeModal, orgUnitGroupHelper, originOrgunitCreator);
            }));

            afterEach(function() {
                Timecop.returnToPresent();
                Timecop.uninstall();
            });

            it("should save aggregate module", function() {
                var parent = {
                    "name": "Project1",
                    "id": "someid",
                    "children": []
                };

                orgUnitRepo.get.and.returnValue(utils.getPromise(q, parent));

                spyOn(systemSettingRepo, "get").and.returnValue(utils.getPromise(q, {}));
                spyOn(dhisId, "get").and.callFake(function(name) {
                    return name;
                });
                dataSetRepo.getOriginDatasets.and.returnValue(utils.getPromise(q, {}));

                scope.$apply();

                scope.orgUnit = parent;
                scope.module = {
                    'name': "Module1",
                    'serviceType': "Aggregate",
                    'openingDate': new Date(),
                    'parent': parent
                };

                var enrichedAggregateModule = {
                    name: 'Module1',
                    shortName: 'Module1',
                    displayName: 'Project1 - Module1',
                    id: 'Module1someid',
                    level: NaN,
                    openingDate: moment(new Date()).toDate(),
                    attributeValues: [{
                        created: moment().toISOString(),
                        lastUpdated: moment().toISOString(),
                        attribute: {
                            code: "Type",
                            name: "Type",
                        },
                        value: 'Module'
                    }, {
                        created: moment().toISOString(),
                        lastUpdated: moment().toISOString(),
                        attribute: {
                            code: "isLineListService",
                            name: "Is Linelist Service"
                        },
                        value: 'false'
                    }, {
                        created: moment().toISOString(),
                        lastUpdated: moment().toISOString(),
                        attribute: {
                            code: "isNewDataModel",
                            name: "Is New Data Model"
                        },
                        value: 'true'
                    }],
                    parent: {
                        name: 'Project1',
                        id: 'someid'
                    }
                };

                scope.save();
                scope.$apply();
                expect(scope.saveFailure).toBe(false);

                expect(orgUnitRepo.upsert).toHaveBeenCalledWith(enrichedAggregateModule);
                expect(hustle.publish).toHaveBeenCalledWith({
                    data: enrichedAggregateModule,
                    type: "upsertOrgUnit",
                    locale: "en",
                    desc: "save organisation unit: Module1"
                }, "dataValues");
            });

            it("should associate aggregate datasets with module", function() {
                scope.module = {
                    "id": "mod1",
                    "name": "mod1",
                    "openingDate": "2014-04-01",
                    "parent": {
                        "id": "pid",
                        "name": "parent",
                        "level": 5
                    }
                };

                var enrichedModule = {
                    "name": 'mod1',
                    "shortName": 'mod1',
                    "displayName": 'parent - mod1',
                    "id": 'mod1pid',
                    "level": 6,
                    "openingDate": moment("2014-04-01").toDate(),
                    "attributeValues": [{
                        "created": '2014-04-01T00:00:00.000Z',
                        "lastUpdated": '2014-04-01T00:00:00.000Z',
                        "attribute": {
                            "code": 'Type',
                            "name": 'Type'
                        },
                        "value": 'Module'
                    }, {
                        "created": '2014-04-01T00:00:00.000Z',
                        "lastUpdated": '2014-04-01T00:00:00.000Z',
                        "attribute": {
                            "code": 'isLineListService',
                            "name": 'Is Linelist Service'
                        },
                        "value": 'false'
                    }, {
                        "created": '2014-04-01T00:00:00.000Z',
                        "lastUpdated": '2014-04-01T00:00:00.000Z',
                        "attribute": {
                            "code": "isNewDataModel",
                            "name": "Is New Data Model"
                        },
                        "value": 'true'
                    }],
                    "parent": {
                        "name": 'parent',
                        "id": 'pid'
                    }
                };

                var associatedDatasets = [{
                    "id": "ds1",
                    "name": "ds1"
                }];

                scope.associatedDatasets = associatedDatasets;
                spyOn(dhisId, "get").and.callFake(function(name) {
                    return name;
                });
                spyOn(systemSettingRepo, "get").and.returnValue(utils.getPromise(q, {}));

                scope.save();
                scope.$apply();

                expect(dataSetRepo.associateOrgUnits).toHaveBeenCalledWith(associatedDatasets, [enrichedModule]);
            });

            it("should save excluded data elements for the module", function() {
                var parent = {
                    "name": "Project1",
                    "id": "someid",
                    "children": []
                };

                orgUnitRepo.get.and.returnValue(utils.getPromise(q, parent));

                spyOn(systemSettingRepo, "get").and.returnValue(utils.getPromise(q, {}));
                spyOn(dhisId, "get").and.callFake(function(name) {
                    return name;
                });

                scope.$apply();
                var projectId = "someid";

                scope.orgUnit = parent;
                scope.module = {
                    'name': "Module1",
                    'serviceType': "Aggregate",
                    'openingDate': new Date(),
                    'parent': parent
                };
                var enrichedAssociatedDatasets = [{
                    "name": "OPD",
                    "id": "DS_OPD",
                    "organisationUnits": [{
                        "id": "mod1"
                    }],
                    "attributeValues": [{
                        "attribute": {
                            "id": "wFC6joy3I8Q",
                            "code": "isNewDataModel",
                        },
                        "value": "false"
                    }],
                    "sections": [{
                        "dataElements": [{
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
                }];

                dataSetRepo.getOriginDatasets.and.returnValue(utils.getPromise(q, {}));

                scope.associatedDatasets = enrichedAssociatedDatasets;
                scope.save();
                scope.$apply();

                var expectedSystemSetting = {
                    "key": "Module1someid",
                    "value": {
                        clientLastUpdated: "2014-04-01T00:00:00.000Z",
                        dataElements: ["1", "3"]
                    }
                };

                var expectedHustleMessage = {
                    data: expectedSystemSetting,
                    type: "uploadSystemSetting",
                    locale: "en",
                    desc: "upload sys settings for Module1"
                };

                expect(systemSettingRepo.upsert).toHaveBeenCalledWith(expectedSystemSetting);
                expect(hustle.publish.calls.argsFor(2)).toEqual([expectedHustleMessage, 'dataValues']);
            });

            it("should create org unit groups", function() {
                scope.module = {
                    "id": "mod1",
                    "name": "mod1",
                    "openingDate": "2014-04-01",
                    "parent": {
                        "id": "pid",
                        "name": "parent",
                        "level": 5
                    }
                };

                var associatedDatasets = [{
                    "id": "ds1",
                    "name": "ds1"
                }];

                var enrichedModule = {
                    "name": 'mod1',
                    "shortName": 'mod1',
                    "displayName": 'parent - mod1',
                    "id": 'mod1pid',
                    "level": 6,
                    "openingDate": moment("2014-04-01").toDate(),
                    "attributeValues": [{
                        "created": '2014-04-01T00:00:00.000Z',
                        "lastUpdated": '2014-04-01T00:00:00.000Z',
                        "attribute": {
                            "code": 'Type',
                            "name": 'Type'
                        },
                        "value": 'Module'
                    }, {
                        "created": '2014-04-01T00:00:00.000Z',
                        "lastUpdated": '2014-04-01T00:00:00.000Z',
                        "attribute": {
                            "code": 'isLineListService',
                            "name": 'Is Linelist Service'
                        },
                        "value": 'false'
                    }, {
                        "created": '2014-04-01T00:00:00.000Z',
                        "lastUpdated": '2014-04-01T00:00:00.000Z',
                        "attribute": {
                            "code": "isNewDataModel",
                            "name": "Is New Data Model"
                        },
                        "value": 'true'
                    }],
                    "parent": {
                        "name": 'parent',
                        "id": 'pid'
                    }
                };

                scope.associatedDatasets = associatedDatasets;
                spyOn(dhisId, "get").and.callFake(function(name) {
                    return name;
                });
                spyOn(systemSettingRepo, "get").and.returnValue(utils.getPromise(q, {}));
                systemSettingRepo.upsert.and.returnValue(utils.getPromise(q, {}));

                scope.save();
                scope.$apply();

                expect(orgUnitGroupHelper.createOrgUnitGroups).toHaveBeenCalledWith([enrichedModule], false);
            });

            it("should set datasets associated with module for edit", function() {
                spyOn(systemSettingRepo, "get").and.returnValue(utils.getPromise(q, {}));
                scope.orgUnit = {
                    "id": "mod2",
                    "parent": {
                        "id": "par1"
                    }
                };

                scope.isNewMode = false;

                spyOn(dataSetRepo, "getAllForOrgUnit").and.returnValue(utils.getPromise(q, [datasetsdata[1]]));
                dataSetRepo.getEnriched.and.callFake(function(ds) {
                    return ds;
                });
                aggregateModuleController = new AggregateModuleController(scope, hustle, orgUnitRepo, dataSetRepo, systemSettingRepo, db, location, q, fakeModal);
                scope.$apply();

                expect(scope.isDisabled).toBeFalsy();
                expect(scope.associatedDatasets.length).toEqual(1);
                expect(scope.nonAssociatedDataSets).toEqual([datasetsdata[0], datasetsdata[2]]);
                expect(scope.selectedDataset).toEqual(scope.associatedDatasets[0]);
                expect(scope.getEnriched);
            });

            it("should disable update button", function() {
                spyOn(dataSetRepo, "getAllForOrgUnit").and.returnValue(utils.getPromise(q, []));
                spyOn(systemSettingRepo, "get").and.returnValue(utils.getPromise(q, {}));
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
                        "value": "true"
                    }]
                };
                scope.isNewMode = false;

                aggregateModuleController = new AggregateModuleController(scope, hustle, orgUnitRepo, dataSetRepo, systemSettingRepo, db, location, q, fakeModal);

                scope.$apply();

                expect(scope.isDisabled).toBeTruthy();
            });

            it("should update system setting while updating module", function() {
                spyOn(systemSettingRepo, "get").and.returnValue(utils.getPromise(q, {
                    "key": 1,
                    "value": {}
                }));

                var oldid = "oldid";
                scope.orgUnit = {
                    "id": oldid,
                    "name": "module OLD name",
                    "parent": parent
                };

                scope.isNewMode = false;

                aggregateModuleController = new AggregateModuleController(scope, hustle, orgUnitRepo, dataSetRepo, systemSettingRepo, db, location, q, fakeModal);
                scope.$apply();

                scope.associatedDatasets = [{
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
                }];

                var updatedModule = {
                    name: "module NEW name",
                    id: oldid,
                    openingDate: new Date(),
                    serviceType: "Aggregate",
                    parent: parent
                };
                scope.module = updatedModule;
                scope.update();
                scope.$apply();

                expect(systemSettingRepo.get).toHaveBeenCalledWith(oldid);

                var expectedSystemSetting = {
                    "key": oldid,
                    "value": {
                        clientLastUpdated: "2014-04-01T00:00:00.000Z",
                        dataElements: ["1", "3"]
                    }
                };

                expect(systemSettingRepo.upsert).toHaveBeenCalledWith(expectedSystemSetting);
                expect(hustle.publish).toHaveBeenCalledWith({
                    data: expectedSystemSetting,
                    type: "uploadSystemSetting",
                    locale: "en",
                    desc: "upload sys settings for module NEW name"
                }, "dataValues");
            });

            it("should update module name", function() {
                spyOn(dataSetRepo, "getAllForOrgUnit").and.returnValue(utils.getPromise(q, []));
                spyOn(systemSettingRepo, "get").and.returnValue(utils.getPromise(q, {}));
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

                var updatedModule = {
                    name: "module NEW name",
                    id: oldid,
                    openingDate: new Date(),
                    serviceType: "Aggregate",
                    parent: parent
                };

                scope.isNewMode = false;
                aggregateModuleController = new AggregateModuleController(scope, hustle, orgUnitRepo, dataSetRepo, systemSettingRepo, db, location, q, fakeModal);
                scope.$apply();

                scope.module = updatedModule;
                scope.update();
                scope.$apply();

                var expectedModule = {
                    name: 'module NEW name',
                    shortName: 'module NEW name',
                    displayName: 'Par1 - module NEW name',
                    id: oldid,
                    level: 6,
                    openingDate: new Date(),
                    attributeValues: [{
                        created: moment().toISOString(),
                        lastUpdated: moment().toISOString(),
                        attribute: {
                            code: 'Type',
                            name: 'Type'
                        },
                        value: 'Module'
                    }, {
                        created: moment().toISOString(),
                        lastUpdated: moment().toISOString(),
                        attribute: {
                            code: 'isLineListService',
                            name: 'Is Linelist Service'
                        },
                        value: 'false'
                    }, {
                        created: moment().toISOString(),
                        lastUpdated: moment().toISOString(),
                        attribute: {
                            code: "isNewDataModel",
                            name: "Is New Data Model"
                        },
                        value: 'true'
                    }],
                    parent: {
                        name: "Par1",
                        id: 'par1'
                    }
                };

                expect(orgUnitRepo.upsert).toHaveBeenCalledWith(expectedModule);
                expect(hustle.publish).toHaveBeenCalledWith({
                    data: expectedModule,
                    type: "upsertOrgUnit",
                    locale: "en",
                    desc: "save organisation unit: module NEW name"
                }, "dataValues");
            });

            it("should return false if datasets for modules are selected", function() {
                spyOn(systemSettingRepo, "get").and.returnValue(utils.getPromise(q, {}));
                scope.$apply();
                scope.associatedDatasets = [{
                    'id': 'ds_11',
                    'name': 'dataset11',
                }, {
                    'id': 'ds_12',
                    'name': 'dataset12'
                }];

                expect(scope.areDatasetsSelected()).toEqual(true);
            });

            it("should return true if dataset is not selected", function() {
                spyOn(systemSettingRepo, "get").and.returnValue(utils.getPromise(q, {}));
                scope.$apply();
                scope.associatedDatasets = [];

                expect(scope.areDatasetsSelected()).toEqual(false);
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

                scope.changeDataElementSelection(section);
                expect(section).toEqual(expectedSection);
            });

            it("should de-select the section if all data elements under it are de-selected", function() {
                var section = {
                    'id': "sec1",
                    "dataElements": [{
                        'id': "test1",
                        'isIncluded': false
                    }, {
                        'id': "test2",
                        'isIncluded': false
                    }, {
                        'id': "test3",
                        'isIncluded': false
                    }]
                };

                var expectedSection = {
                    id: 'sec1',
                    dataElements: [{
                        'id': "test1",
                        'isIncluded': false
                    }, {
                        'id': "test2",
                        'isIncluded': false
                    }, {
                        'id': "test3",
                        'isIncluded': false
                    }],
                    isIncluded: false
                };

                scope.changeSectionSelection(section);
                expect(section).toEqual(expectedSection);
            });

            it("should de-select the section if even one of the data elements under it are de-selected", function() {
                var section = {
                    'id': "sec1",
                    "dataElements": [{
                        'id': "test1",
                        'isIncluded': true
                    }, {
                        'id': "test2",
                        'isIncluded': true
                    }, {
                        'id': "test3",
                        'isIncluded': false
                    }]
                };

                var expectedSection = {
                    id: 'sec1',
                    dataElements: [{
                        'id': "test1",
                        'isIncluded': true
                    }, {
                        'id': "test2",
                        'isIncluded': true
                    }, {
                        'id': "test3",
                        'isIncluded': false
                    }],
                    isIncluded: false
                };

                scope.changeSectionSelection(section);
                expect(section).toEqual(expectedSection);
            });

            it("should select the section if all the data elements under it are selected", function() {
                var section = {
                    'id': "sec1",
                    "dataElements": [{
                        'id': "test1",
                        'isIncluded': true
                    }, {
                        'id': "test2",
                        'isIncluded': true
                    }, {
                        'id': "test3",
                        'isIncluded': true
                    }]
                };

                var expectedSection = {
                    id: 'sec1',
                    dataElements: [{
                        'id': "test1",
                        'isIncluded': true
                    }, {
                        'id': "test2",
                        'isIncluded': true
                    }, {
                        'id': "test3",
                        'isIncluded': true
                    }],
                    isIncluded: true
                };

                scope.changeSectionSelection(section);
                expect(section).toEqual(expectedSection);
            });

            it("should select a dataset", function() {
                spyOn(systemSettingRepo, "get").and.returnValue(utils.getPromise(q, {}));
                scope.$apply();

                var dataset = {
                    name: "Malaria",
                    id: "dataset_1",
                    sections: [{
                        'id': 'Id1'
                    }, {
                        'id': 'Id2'
                    }]
                };

                scope.selectDataSet(dataset);
                scope.$apply();

                expect(scope.selectedDataset).toEqual(dataset);
                expect(scope.isExpanded.Id1).toEqual(true);
                expect(scope.isExpanded.Id2).toEqual(false);
            });

            it("should return false if no dataset is selected", function() {
                spyOn(systemSettingRepo, "get").and.returnValue(utils.getPromise(q, {}));
                scope.$apply();
                scope.selectedDataset = undefined;
                expect(scope.areDataElementsSelectedForSection()).toEqual(false);
            });

            it("should return true if any one section is selected for dataset", function() {
                spyOn(systemSettingRepo, "get").and.returnValue(utils.getPromise(q, {}));
                scope.$apply();

                scope.selectedDataset = {
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

                expect(scope.areDataElementsSelectedForSection()).toEqual(true);
            });

            it("should disable module", function() {
                spyOn(systemSettingRepo, "get").and.returnValue(utils.getPromise(q, {}));
                var parent = {
                    "id": "par1",
                    "name": "Par1"
                };
                scope.$parent.closeNewForm = jasmine.createSpy();
                scope.$apply();
                var module = {
                    name: "test1",
                    id: "projectId",
                    dataSets: [],
                    attributeValues: [],
                    parent: parent
                };
                scope.module = module;

                var expectedModule = {
                    name: 'test1',
                    shortName: 'test1',
                    displayName: 'Par1 - test1',
                    id: 'projectId',
                    level: 6,
                    openingDate: moment(new Date()).toDate(),
                    attributeValues: [{
                        created: moment().toISOString(),
                        lastUpdated: moment().toISOString(),
                        attribute: {
                            code: 'Type',
                            name: 'Type'
                        },
                        value: 'Module'
                    }, {
                        created: moment().toISOString(),
                        lastUpdated: moment().toISOString(),
                        attribute: {
                            code: 'isLineListService',
                            name: 'Is Linelist Service'
                        },
                        value: 'false'
                    }, {
                        created: '2014-04-01T00:00:00.000Z',
                        lastUpdated: '2014-04-01T00:00:00.000Z',
                        attribute: {
                            code: "isNewDataModel",
                            name: "Is New Data Model"
                        },
                        value: 'true'
                    }, {
                        created: '2014-04-01T00:00:00.000Z',
                        lastUpdated: '2014-04-01T00:00:00.000Z',
                        attribute: {
                            code: 'isDisabled',
                            name: 'Is Disabled'
                        },
                        value: "true"
                    }],
                    parent: {
                        name: 'Par1',
                        id: 'par1'
                    }
                };
                var expectedHustleMessage = {
                    data: expectedModule,
                    type: "upsertOrgUnit",
                    locale: "en",
                    desc: "disable organisation unit: test1"
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

            it("should change collapsed", function() {
                spyOn(systemSettingRepo, "get").and.returnValue(utils.getPromise(q, {}));

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

            it("should create patient origin org units", function() {
                scope.module = {
                    "id": "mod1",
                    "name": "mod1",
                    "openingDate": "2014-04-01",
                    "parent": {
                        "id": "pid",
                        "name": "parent",
                        "level": 5
                    }
                };

                var enrichedAggregateModule = {
                    name: 'mod1',
                    shortName: 'mod1',
                    displayName: 'parent - mod1',
                    id: 'mod1pid',
                    level: 6,
                    openingDate: moment("2014-04-01").toDate(),
                    attributeValues: [{
                        created: moment().toISOString(),
                        lastUpdated: moment().toISOString(),
                        attribute: {
                            code: "Type",
                            name: "Type",
                        },
                        value: 'Module'
                    }, {
                        created: moment().toISOString(),
                        lastUpdated: moment().toISOString(),
                        attribute: {
                            code: "isLineListService",
                            name: "Is Linelist Service"
                        },
                        value: 'false'
                    }, {
                        created: moment().toISOString(),
                        lastUpdated: moment().toISOString(),
                        attribute: {
                            code: "isNewDataModel",
                            name: "Is New Data Model"
                        },
                        value: 'true'
                    }],
                    parent: {
                        name: 'parent',
                        id: 'pid'
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
                spyOn(systemSettingRepo, "get").and.returnValue(utils.getPromise(q, {}));

                scope.save();
                scope.$apply();

                expect(originOrgunitCreator.create).toHaveBeenCalledWith(enrichedAggregateModule);
                expect(hustle.publish.calls.count()).toEqual(5);
                expect(hustle.publish.calls.argsFor(3)).toEqual([{
                    "data": originOrgUnit,
                    "type": "upsertOrgUnit",
                    "locale": "en",
                    "desc": "save organisation unit: origin org unit"
                }, "dataValues"]);
            });

            it("should associate geographic origin dataset to patient origin org unit", function() {
                scope.module = {
                    "id": "mod1",
                    "name": "mod1",
                    "openingDate": "2014-04-01",
                    "parent": {
                        "id": "pid",
                        "name": "parent",
                        "level": 5
                    }
                };

                var originDatasets = [{
                    "id": "originds1",
                    "name": "originds1"
                }];

                var originOrgUnit = [{
                    "name": "Unknown",
                    "shortName": "Unknown",
                    "displayName": "Unknown",
                    "id": "Unknownmod1pid",
                    "level": 7,
                    "openingDate": moment("2014-04-01").toDate(),
                    "attributeValues": [{
                        "attribute": {
                            "code": "Type",
                            "name": "Type"
                        },
                        "value": "Patient Origin"
                    }],
                    "parent": {
                        "id": "mod1pid"
                    }
                }];

                spyOn(dhisId, "get").and.callFake(function(name) {
                    return name;
                });

                dataSetRepo.getOriginDatasets.and.returnValue(utils.getPromise(q, originDatasets));
                spyOn(systemSettingRepo, "get").and.returnValue(utils.getPromise(q, {}));
                originOrgunitCreator.create.and.returnValue(utils.getPromise(q, originOrgUnit));

                scope.save();
                scope.$apply();

                expect(dataSetRepo.associateOrgUnits.calls.count()).toEqual(2);
                expect(dataSetRepo.associateOrgUnits.calls.argsFor(1)).toEqual([originDatasets, originOrgUnit]);
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
