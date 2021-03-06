define(["aggregateModuleController", "angularMocks", "utils", "testData", "orgUnitGroupHelper", "moment", "timecop", "dhisId", "dataSetRepository", "orgUnitRepository",
    "originOrgunitCreator", "excludedDataElementsRepository", "systemSettingRepository", "translationsService", "orgUnitMapper", "systemSettingsTransformer", "customAttributes"
    ],
    function(AggregateModuleController, mocks, utils, testData, OrgUnitGroupHelper, moment, timecop, dhisId, DatasetRepository,
        OrgUnitRepository, OriginOrgunitCreator, ExcludedDataElementsRepository, SystemSettingRepository, TranslationsService, orgUnitMapper, systemSettingsTransformer, customAttributes) {

        var scope,rootScope, mockOrgStore, db, q, location, orgUnitRepo, orgunitGroupRepo, hustle,
            dataSetRepo, systemSettingRepository, excludedDataElementsRepository, fakeModal, fakeModalStack, allPrograms, originOrgunitCreator, translationsService, orgUnitGroupHelper;

        describe("aggregate module controller", function() {
            var initialiseController = function() {
                new AggregateModuleController(scope, rootScope, hustle, orgUnitRepo, dataSetRepo, systemSettingRepository, excludedDataElementsRepository, db, location, q, fakeModal, fakeModalStack, orgUnitGroupHelper, originOrgunitCreator, translationsService);
            };

            beforeEach(module('hustle'));
            beforeEach(mocks.inject(function($rootScope, $q, $hustle, $location) {
                rootScope = $rootScope;
                scope = $rootScope.$new();
                q = $q;
                hustle = $hustle;
                spyOn(hustle, "publish").and.returnValue(utils.getPromise(q, {}));

                location = $location;

                orgUnitRepo = new OrgUnitRepository();
                orgunitGroupRepo = utils.getMockRepo(q);

                rootScope.startLoading = jasmine.createSpy('startLoading');
                rootScope.stopLoading = jasmine.createSpy('stopLoading');

                spyOn(orgUnitRepo, "upsert").and.returnValue(utils.getPromise(q, {}));
                spyOn(orgUnitRepo, "getAllModulesInOrgUnits").and.returnValue(utils.getPromise(q, {}));
                spyOn(orgUnitRepo, "get").and.returnValue(utils.getPromise(q, {}));
                spyOn(orgUnitRepo, "associateDataSetsToOrgUnits").and.returnValue(utils.getPromise(q, {}));
                spyOn(orgUnitRepo, "removeDataSetsFromOrgUnits").and.returnValue(utils.getPromise(q, {}));
                spyOn(orgUnitRepo, "getAllDataSetsForOrgUnit").and.returnValue(utils.getPromise(q, {}));
                spyOn(orgUnitRepo, "findAllByParent").and.returnValue(utils.getPromise(q, [{ id: 'someId' }]));

                originOrgunitCreator = new OriginOrgunitCreator();
                spyOn(originOrgunitCreator, "create").and.returnValue(utils.getPromise(q, {}));

                dataSetRepo = new DatasetRepository();
                spyOn(dataSetRepo, "getAll").and.returnValue(utils.getPromise(q, []));
                spyOn(dataSetRepo, "findAllForOrgUnits").and.returnValue(utils.getPromise(q, []));
                spyOn(dataSetRepo, "includeDataElements").and.returnValue(utils.getPromise(q, []));

                systemSettingRepository = new SystemSettingRepository();
                spyOn(systemSettingRepository, "get").and.returnValue(utils.getPromise(q, {}));

                excludedDataElementsRepository = new ExcludedDataElementsRepository();
                spyOn(excludedDataElementsRepository, "get").and.returnValue(utils.getPromise(q, {}));
                spyOn(excludedDataElementsRepository, "upsert").and.returnValue(utils.getPromise(q, {}));

                orgUnitGroupHelper = new OrgUnitGroupHelper(hustle, q, scope, orgUnitRepo, orgunitGroupRepo);
                spyOn(orgUnitGroupHelper, "associateModuleAndOriginsToGroups");

                translationsService = new TranslationsService();
                spyOn(translationsService, "translate").and.returnValue([]);

                spyOn(systemSettingsTransformer, "excludedDataElementsForAggregateModule").and.returnValue([]);

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

                fakeModalStack = {
                    dismissAll: function () {}
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

                scope.locale = "en";

                scope.resourceBundle = {
                    "disableOrgUnitDesc": "disable organisation unit",
                    "upsertOrgUnitDesc": "save organisation unit",
                    "uploadSystemSettingDesc": "upload sys settings for {{module_name}}"
                };

                scope.isNewMode = true;

                scope.form = {
                    $setDirty : jasmine.createSpy('$setDirty')
                };

                scope.geographicOriginDisabled = false;

                spyOn(customAttributes, 'getBooleanAttributeValue').and.returnValue(false);

                Timecop.install();
                Timecop.freeze(new Date("2014-04-01T00:00:00.000Z"));

                initialiseController();
            }));

            afterEach(function() {
                Timecop.returnToPresent();
                Timecop.uninstall();
            });

            it("should save aggregate module", function() {
                var enrichedAggregateModule = {
                    name: 'Module1',
                    shortName: 'Module1',
                    displayName: 'Project1 - Module1',
                    id: 'Module1someid',
                    level: NaN,
                    openingDate: moment.utc(new Date()).format('YYYY-MM-DD'),
                    attributeValues: [{
                        created: moment().toISOString(),
                        lastUpdated: moment().toISOString(),
                        attribute: {
                            code: "Type"
                        },
                        value: 'Module'
                    }],
                    parent: {
                        name: 'Project1',
                        id: 'someid'
                    },
                    dataSets: []
                };

                spyOn(orgUnitMapper, 'mapToModule').and.returnValue(enrichedAggregateModule);

                scope.module = {
                    'name': "Module1",
                    'serviceType': "Aggregate",
                    'openingDate': new Date(),
                    'parent': parent
                };

                scope.save();
                scope.$apply();
                expect(scope.saveFailure).toBe(false);

                expect(excludedDataElementsRepository.get).not.toHaveBeenCalled();
                expect(orgUnitRepo.upsert).toHaveBeenCalledWith(enrichedAggregateModule);

                expect(hustle.publish).toHaveBeenCalledWith({
                    data: { orgUnitId: enrichedAggregateModule.id },
                    type: "syncOrgUnit",
                    locale: "en",
                    desc: "save organisation unit"
                }, "dataValues");
            });

            describe('save', function () {
                var mockModule;

                beforeEach(function () {
                    mockModule = {
                        id: 'someModuleId'
                    };
                    spyOn(orgUnitMapper, 'mapToModule').and.returnValue(mockModule);
                });

                it("should upsert the module with the associated datasets for newly created module", function() {
                    var datasets = [{
                        'id': 'someDataSetId'
                    }, {
                        'id': 'someOtherDataSetId'
                    }];

                    scope.associatedDatasets = [datasets[0]];
                    scope.save();
                    scope.$apply();

                    var expectedModule = {
                        id: 'someModuleId',
                        dataSets: [
                            {
                                id: 'someDataSetId'
                            }]
                    };
                    expect(orgUnitRepo.upsert).toHaveBeenCalledWith(expectedModule);
                });

                it('should associate the population dataset for the newly created module', function () {
                    var datasets = [{
                        'id': 'populationDataSetId',
                        'isPopulationDataset': true
                    }];

                    dataSetRepo.getAll.and.returnValue(utils.getPromise(q, datasets));

                    scope.$apply();
                    scope.associatedDatasets = [];
                    scope.save();
                    scope.$apply();

                    var expectedModule = {
                        id: 'someModuleId',
                        dataSets: [
                            {
                                id: 'populationDataSetId'
                            }]
                    };
                    expect(orgUnitRepo.upsert).toHaveBeenCalledWith(expectedModule);
                });

                it('should associate the referral location dataset if the associateReferralLocation is set', function () {
                    var datasets = [{
                        id: 'someDataSetId',
                        isReferralDataset: true
                    }];
                    dataSetRepo.getAll.and.returnValue(utils.getPromise(q, datasets));

                    scope.$apply();
                    scope.associatedDatasets = [];
                    scope.associateReferralLocation = true;
                    scope.save();
                    scope.$apply();

                    var expectedModule = {
                        id: 'someModuleId',
                        dataSets: [
                            {
                                id: 'someDataSetId'
                            }]
                    };
                    expect(orgUnitRepo.upsert).toHaveBeenCalledWith(expectedModule);
                });

                it('should associate geographic origin dataSet if associateOriginDataSet is set', function () {
                    scope.associateOriginDataSet = true;
                    scope.save();
                    scope.$apply();

                    expect(originOrgunitCreator.create).toHaveBeenCalledWith(mockModule, undefined, true);
                });
            });

            it("should save excluded data elements for the module", function() {
                var parent = {
                    "id": "someid"
                };

                orgUnitRepo.get.and.returnValue(utils.getPromise(q, parent));

                spyOn(orgUnitMapper, 'mapToModule').and.returnValue({
                    'id': "Module1" + parent.id,
                    'name': "Module1",
                    'parent': parent
                });

                var excludedDataElements = [{
                    id: 'de1'
                },{
                    id: 'de3'
                }];

                systemSettingsTransformer.excludedDataElementsForAggregateModule.and.returnValue(excludedDataElements);

                scope.save();
                scope.$apply();

                var expectedExcludedDataElements = {
                    "orgUnit": "Module1someid",
                    "clientLastUpdated": "2014-04-01T00:00:00.000Z",
                    "dataElements": [{
                        "id": "de1"
                    }, {
                        "id": "de3"
                    }]
                };

                var expectedHustleMessage = {
                    data: "Module1someid",
                    type: "uploadExcludedDataElements",
                    locale: "en",
                    desc: "upload sys settings for Module1"
                };

                expect(excludedDataElementsRepository.upsert).toHaveBeenCalledWith(expectedExcludedDataElements);
                expect(hustle.publish.calls.argsFor(1)).toEqual([expectedHustleMessage, 'dataValues']);
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
                    "openingDate": moment.utc("2014-04-01").format('YYYY-MM-DD'),
                    "attributeValues": [{
                        "created": '2014-04-01T00:00:00.000Z',
                        "lastUpdated": '2014-04-01T00:00:00.000Z',
                        "attribute": {
                            "code": 'Type'
                        },
                        "value": 'Module'
                    }, {
                        "created": '2014-04-01T00:00:00.000Z',
                        "lastUpdated": '2014-04-01T00:00:00.000Z',
                        "attribute": {
                            "code": 'isLineListService'
                        },
                        "value": 'false'
                    }, {
                        "created": '2014-04-01T00:00:00.000Z',
                        "lastUpdated": '2014-04-01T00:00:00.000Z',
                        "attribute": {
                            "code": "isNewDataModel"
                        },
                        "value": 'true'
                    }],
                    "parent": {
                        "name": 'parent',
                        "id": 'pid'
                    },
                    "dataSets": [{id: "ds1"}]
                };

                scope.associatedDatasets = associatedDatasets;
                spyOn(orgUnitMapper, 'mapToModule').and.returnValue(enrichedModule);
                spyOn(dhisId, "get").and.callFake(function(name) {
                    return name;
                });

                scope.save();
                scope.$apply();

                expect(orgUnitGroupHelper.associateModuleAndOriginsToGroups).toHaveBeenCalledWith([enrichedModule]);
            });

            it("should set datasets associated with module for edit", function() {
                var datasets = [{
                    "id": "ds1",
                    "isAggregateService": true,
                    "sections": []
                }, {
                    "id": "ds2",
                    "isAggregateService": true,
                    "sections": []
                }];

                scope.orgUnit = {
                    "id": "mod2",
                    "parent": {
                        "id": "par1"
                    }
                };

                scope.isNewMode = false;

                dataSetRepo.getAll.and.returnValue(utils.getPromise(q, datasets));
                dataSetRepo.findAllForOrgUnits.and.returnValue(utils.getPromise(q, [datasets[1]]));
                dataSetRepo.includeDataElements.and.returnValue(utils.getPromise(q, datasets));
                translationsService.translate.and.returnValue(datasets);

                initialiseController();
                scope.$apply();

                expect(scope.isDisabled).toBeFalsy();
                expect(scope.associatedDatasets.length).toEqual(1);
                expect(scope.nonAssociatedDataSets).toEqual([datasets[0]]);
                expect(scope.selectedDataset).toEqual(datasets[1]);
            });

            it("should disable update button", function() {
                scope.orgUnit = {
                    "id": "mod2",
                    "parent": {
                        "id": "par1"
                    },
                    "dataSets": [{
                        "id": "ds1",
                        "name": "dataset1",
                        "attributeValues": []
                    }],
                    "attributeValues": []
                };
                scope.isNewMode = false;

                customAttributes.getBooleanAttributeValue.and.returnValue(true);
                initialiseController();

                scope.$apply();

                expect(scope.isDisabled).toBeTruthy();
            });

            it("should update system setting while updating module", function() {
                var oldid = "oldid";
                scope.orgUnit = {
                    "id": oldid,
                    "name": "module OLD name",
                    "parent": parent
                };

                scope.isNewMode = false;

                initialiseController();
                scope.$apply();

                scope.associatedDatasets = [{
                    sections: [{
                        dataElements: [{
                            "id": "de1",
                            "isIncluded": false
                        }, {
                            "id": "de2",
                            "isIncluded": true
                        }, {
                            "id": "de3",
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

                var excludedDataElements = [{
                    id: 'de1'
                },{
                    id: 'de3'
                }];

                spyOn(orgUnitMapper, 'mapToModule').and.returnValue(updatedModule);
                systemSettingsTransformer.excludedDataElementsForAggregateModule.and.returnValue(excludedDataElements);

                scope.update();
                scope.$apply();

                expect(excludedDataElementsRepository.get).toHaveBeenCalledWith(oldid);

                var expectedExcludedDataElementsSetting = {
                    "orgUnit": oldid,
                    "clientLastUpdated": "2014-04-01T00:00:00.000Z",
                    "dataElements": [{
                        "id": "de1"
                    }, {
                        "id": "de3"
                    }]
                };

                expect(excludedDataElementsRepository.upsert).toHaveBeenCalledWith(expectedExcludedDataElementsSetting);
                expect(hustle.publish).toHaveBeenCalledWith({
                    data: oldid,
                    type: "uploadExcludedDataElements",
                    locale: "en",
                    desc: "upload sys settings for module NEW name"
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

                var updatedModule = {
                    name: "module NEW name",
                    id: oldid,
                    openingDate: new Date(),
                    serviceType: "Aggregate",
                    parent: parent
                };

                scope.isNewMode = false;
                initialiseController();
                scope.$apply();

                spyOn(orgUnitMapper, 'mapToModule').and.returnValue(updatedModule);
                scope.update();
                scope.$apply();

                expect(orgUnitRepo.upsert).toHaveBeenCalledWith(updatedModule);
                expect(hustle.publish).toHaveBeenCalledWith({
                    data: { orgUnitId: updatedModule.id },
                    type: "syncOrgUnit",
                    locale: "en",
                    desc: "save organisation unit"
                }, "dataValues");
            });

            describe('update', function () {
                var mockOrgUnit;

                beforeEach(function () {
                    mockOrgUnit = {id: 'someOrgUnitId'};
                    spyOn(orgUnitMapper, 'mapToModule').and.returnValue(mockOrgUnit);
                });

                it('should upsert the module with the associated dataSets for existing module', function () {
                    var datasetOne = {
                        "id": "ds1"
                    };
                    var datasetTwo = {
                        "id": "ds2"
                    };

                    scope.$apply();
                    scope.associatedDatasets = [datasetOne, datasetTwo];

                    scope.update();
                    scope.$apply();

                    var expectedOrgUnit = {
                        id: 'someOrgUnitId',
                        dataSets: [{
                            id: datasetOne.id
                        }, {
                            id: datasetTwo.id
                        }]
                    };
                    expect(orgUnitRepo.upsert).toHaveBeenCalledWith(expectedOrgUnit);
                });

                it('should associate the module with the population dataSet', function () {
                    var populationDataset = {
                        id: "someId",
                        isPopulationDataset: true
                    };

                    dataSetRepo.getAll.and.returnValue(utils.getPromise(q, [populationDataset]));
                    scope.$apply();

                    scope.update();
                    scope.$apply();

                    var expectedOrgUnit = {
                        id: 'someOrgUnitId',
                        dataSets: [{
                            id: populationDataset.id
                        }]
                    };
                    expect(orgUnitRepo.upsert).toHaveBeenCalledWith(expectedOrgUnit);
                });

                it('should associate the module with referralLocation dataSet only if configured', function () {
                    var referralDataSet = {
                        id: "someId",
                        isReferralDataset: true
                    };

                    dataSetRepo.getAll.and.returnValue(utils.getPromise(q, [referralDataSet]));
                    scope.$apply();
                    scope.associateReferralLocation  = true;

                    scope.update();
                    scope.$apply();

                    var expectedOrgUnit = {
                        id: 'someOrgUnitId',
                        dataSets: [{
                            id: referralDataSet.id
                        }]
                    };
                    expect(orgUnitRepo.upsert).toHaveBeenCalledWith(expectedOrgUnit);
                });

                describe('geographicOriginDataSet', function () {
                    var mockOrigins, mockOriginDataSets;
                    beforeEach(function () {
                        mockOrigins = [{ id: 'patientOriginId' }];
                        mockOriginDataSets = [{ id: 'mockOriginDataSet', isOriginDataset: true }];
                        orgUnitRepo.findAllByParent.and.returnValue(utils.getPromise(q, mockOrigins));
                        dataSetRepo.getAll.and.returnValue(utils.getPromise(q, mockOriginDataSets));
                    });

                    it('should upsert origins with associated dataSets into indexedDb', function () {
                        scope.associateOriginDataSet = true;
                        scope.update();
                        scope.$apply();

                        expect(orgUnitRepo.upsert).toHaveBeenCalledTimes(2);
                        expect(orgUnitRepo.upsert).toHaveBeenCalledWith({ id: 'patientOriginId', dataSets: [{ id: 'mockOriginDataSet' }]});
                    });

                    it('should upsert origins without dataSets into indexedDb if associateOriginDataset flag is false', function () {
                        scope.associateOriginDataSet = false;
                        scope.update();
                        scope.$apply();

                        expect(orgUnitRepo.upsert).toHaveBeenCalledTimes(2);
                        expect(orgUnitRepo.upsert).toHaveBeenCalledWith({ id: 'patientOriginId', dataSets: []});
                    });

                    it('should publish hustle calls to sync to DHIS', function () {
                        scope.update();
                        scope.$apply();

                        var expectedHustleMessage = {
                            data: { orgUnitId: _.first(mockOrigins).id },
                            type: "syncOrgUnit",
                            locale: "en",
                            desc: scope.resourceBundle.upsertOrgUnitDesc
                        };

                        expect(hustle.publish.calls.argsFor(0)).toEqual([expectedHustleMessage, 'dataValues']);
                    });
                });
            });

            describe('isIncluded flag of section', function () {
                var createSection = function (options) {
                    return _.merge({
                        'id': "sec1",
                        "dataElements": [{
                            'id': "test1",
                            'isIncluded': false,
                        }, {
                            'id': "test2",
                            'isIncluded': false,
                        }],
                    }, options);
                };

                it("should set the isIncluded to true in section if all the data elements under it are selected", function () {
                    var section = createSection({
                        dataElements: [{
                            id: 'test1',
                            isIncluded: true
                        }, {
                            id: "test2",
                            isIncluded: true
                        }]
                    });

                    scope.changeSectionSelection(section);
                    expect(section.isIncluded).toBeTruthy();
                });

                it("should set isIncluded to false for the section if at least one of the data elements under it is de-selected", function () {
                    var section = createSection({
                        "dataElements": [{
                            'id': "test1",
                            'isIncluded': true
                        }, {
                            'id': "test2",
                            'isIncluded': false
                        }]
                    });

                    scope.changeSectionSelection(section);
                    expect(section.isIncluded).toBeFalsy();
                });

                it("should select/de-select all data elements if the section containing it is toggled", function () {
                    var section = createSection();
                    scope.toggleSelect(section);

                    expect(section.dataElements[0].isIncluded).toBeTruthy();
                    expect(section.dataElements[1].isIncluded).toBeTruthy();
                    expect(section.isIncluded).toBeTruthy();
                });
            });

            it("should return false if datasets for modules are selected", function() {
                scope.$apply();
                scope.associatedDatasets = [{
                    'id': 'ds_11',
                    'name': 'dataset11'
                }, {
                    'id': 'ds_12',
                    'name': 'dataset12'
                }];

                expect(scope.areDatasetsSelected()).toEqual(true);
            });

            it("should return true if dataset is not selected", function() {
                scope.$apply();
                scope.associatedDatasets = [];

                expect(scope.areDatasetsSelected()).toEqual(false);
            });

            it("should select a dataset", function() {
                var dataset = {
                    name: "Malaria",
                    id: "dataset_1",
                    sections: [{
                        'id': 'Id1'
                    }, {
                        'id': 'Id2'
                    }]
                };
                dataSetRepo.includeDataElements.and.returnValue(utils.getPromise(q, [dataset]));
                translationsService.translate.and.returnValue([dataset]);

                scope.$apply();
                scope.selectDataSet(dataset);
                scope.$apply();

                expect(scope.selectedDataset).toEqual(dataset);
                expect(scope.isExpanded.Id1).toEqual(true);
                expect(scope.isExpanded.Id2).toEqual(false);
            });

            it("should return false if no dataset is selected", function() {
                scope.$apply();
                scope.selectedDataset = undefined;
                expect(scope.areDataElementsSelectedForSection()).toEqual(false);
            });

            it("should return true if any one section is selected for dataset", function() {
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
                scope.$parent.closeNewForm = jasmine.createSpy();
                scope.$apply();
                var module = {
                    name: "test1",
                    id: "projectId",
                    dataSets: [],
                    attributeValues: []
                };

                var mockDisabledModule = {
                    name: 'test1',
                    id: 'projectId',
                    attributeValues: [{
                        created: '2014-04-01T00:00:00.000Z',
                        lastUpdated: '2014-04-01T00:00:00.000Z',
                        attribute: {
                            code: 'isDisabled'
                        },
                        value: "true"
                    }],
                    parent: {
                        name: 'Par1',
                        id: 'par1'
                    }
                };

                spyOn(orgUnitMapper, 'mapToModule').and.returnValue(module);
                spyOn(orgUnitMapper, 'disable').and.returnValue(mockDisabledModule);
                var expectedHustleMessage = {
                    data: mockDisabledModule,
                    type: "upsertOrgUnit",
                    locale: "en",
                    desc: "disable organisation unit"
                };
                spyOn(fakeModal, "open").and.returnValue({
                    result: utils.getPromise(q, {})
                });

                scope.disable(module);
                scope.$apply();

                expect(orgUnitMapper.disable).toHaveBeenCalled();
                expect(orgUnitRepo.upsert).toHaveBeenCalledWith(mockDisabledModule);
                expect(hustle.publish).toHaveBeenCalledWith(expectedHustleMessage, 'dataValues');
                expect(scope.$parent.closeNewForm).toHaveBeenCalledWith(module, "disabledModule");
                expect(scope.isDisabled).toEqual(true);
            });

            describe("Patient origin org unit", function () {
                it("should create patient origin org units", function()  {
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
                        openingDate: moment.utc("2014-04-01").format('YYYY-MM-DD'),
                        attributeValues: [{
                            created: moment().toISOString(),
                            lastUpdated: moment().toISOString(),
                            attribute: {
                                code: "Type"
                            },
                            value: 'Module'
                        }, {
                            created: moment().toISOString(),
                            lastUpdated: moment().toISOString(),
                            attribute: {
                                code: "isLineListService"
                            },
                            value: 'false'
                        }, {
                            created: moment().toISOString(),
                            lastUpdated: moment().toISOString(),
                            attribute: {
                                code: "isNewDataModel"
                            },
                            value: 'true'
                        }],
                        parent: {
                            name: 'parent',
                            id: 'pid'
                        },
                        dataSets: []
                    };

                    var originOrgUnits = [{
                        "id": "ou1",
                        "name": "origin org unit"
                    }];

                    spyOn(orgUnitMapper, 'mapToModule').and.returnValue(enrichedAggregateModule);

                    originOrgunitCreator.create.and.returnValue(utils.getPromise(q, originOrgUnits));

                    scope.save();
                    scope.$apply();

                    expect(originOrgunitCreator.create).toHaveBeenCalledWith(enrichedAggregateModule, undefined, undefined);
                    expect(hustle.publish.calls.count()).toEqual(3);
                    expect(hustle.publish.calls.argsFor(2)).toEqual([{
                        "data": { orgUnitId: originOrgUnits[0].id},
                        "type": "syncOrgUnit",
                        "locale": "en",
                        "desc": "save organisation unit"
                    }, "dataValues"]);
                });

                it("should not create patient origin org units if geographicOrigin is disabled", function () {
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

                    scope.geographicOriginDisabled = true;
                    scope.save();
                    scope.$apply();

                    expect(originOrgunitCreator.create).not.toHaveBeenCalled();
                });
            });

            it("should apply module templates", function() {
                var datasetId = "a4808d65f51";
                scope.selectedTemplate[datasetId] = "War";

                scope.selectedDataset = {
                    "id": "a4808d65f51",
                    "sections": [{
                        "name": "section1",
                        "id": "section_1",
                        "isIncluded": true,
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
                };

                scope.allTemplates = {
                    "a4808d65f51": {
                        "War": [
                            "de1",
                            "de2"
                        ],
                        "Emergency": [
                            "blah1",
                            "blah2"
                        ],
                        "Default": []
                    },
                    "a4808d65f52": {
                        "War": [
                            "a7d1f604051",
                            "a6cb451f706"
                        ],
                        "Emergency": [
                            3,
                            4
                        ],
                        "Default": []
                    }
                };

                var expectedDataset = {
                    "id": "a4808d65f51",
                    "sections": [{
                        "name": "section1",
                        "id": "section_1",
                        "isIncluded": false,
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
                        "isIncluded": true,
                        "dataElements": [{
                            "id": "de3",
                            "isIncluded": true
                        }]
                    }]
                };

                scope.onTemplateSelect();
                expect(scope.selectedDataset).toEqual(expectedDataset);
            });

            it("should include mandatory data elements irrespective of their status in module templates", function() {
                var datasetId = "a4808d65f51";
                scope.selectedTemplate[datasetId] = "War";

                scope.selectedDataset = {
                    "id": "a4808d65f51",
                    "sections": [{
                        "name": "section1",
                        "id": "section_1",
                        "isIncluded": true,
                        "dataElements": [{
                            "id": "de1",
                            "isIncluded": true,
                            "isMandatory": true
                        }, {
                            "id": "de2",
                            "isIncluded": true,
                            "isMandatory": false
                        }]
                    }, {
                        "name": "section2",
                        "id": "section_2",
                        "dataElements": [{
                            "id": "de3",
                            "isIncluded": false,
                            "isMandatory": false
                        }]
                    }]
                };

                scope.allTemplates = {
                    "a4808d65f51": {
                        "War": [
                            "de1",
                            "de2"
                        ],
                        "Emergency": [
                            "blah1",
                            "blah2"
                        ],
                        "Default": []
                    },
                    "a4808d65f52": {
                        "War": [
                            "a7d1f604051",
                            "a6cb451f706"
                        ],
                        "Emergency": [
                            3,
                            4
                        ],
                        "Default": []
                    }
                };

                var expectedDataset = {
                    "id": "a4808d65f51",
                    "sections": [{
                        "name": "section1",
                        "id": "section_1",
                        "isIncluded": false,
                        "dataElements": [{
                            "id": "de1",
                            "isIncluded": true,
                            "isMandatory": true
                        }, {
                            "id": "de2",
                            "isIncluded": false,
                            "isMandatory": false
                        }]
                    }, {
                        "name": "section2",
                        "id": "section_2",
                        "isIncluded": true,
                        "dataElements": [{
                            "id": "de3",
                            "isIncluded": true,
                            "isMandatory": false
                        }]
                    }]
                };

                scope.onTemplateSelect();
                expect(scope.selectedDataset).toEqual(expectedDataset);
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

            describe('enrich sections of the data sets', function() {
                var datasets;
                beforeEach(function() {
                    datasets = [{
                        "id": "ds1",
                        "organisationUnits": [{
                            "id": "mod1"
                        }],
                        "isAggregateService": true,
                        "sections": [{
                            "name": "section 1",
                            "id": "SEC1",
                            "dataElements": [{
                                "name": "DE1",
                                "id": "DE1",
                                "subSection": "Food"
                            }, {
                                "name": "DE2",
                                "id": "DE2",
                                "subSection": "Drinks"
                            }, {
                                "name": "DE3",
                                "id": "DE3",
                                "subSection": "Default"
                            }]
                        }]
                    }];

                    scope.orgUnit = {
                        "id": "mod2",
                        "parent": {
                            "id": "par1"
                        }
                    };

                    scope.isNewMode = true;

                    dataSetRepo.getAll.and.returnValue(utils.getPromise(q, datasets));
                    dataSetRepo.findAllForOrgUnits.and.returnValue(utils.getPromise(q, datasets));
                    dataSetRepo.includeDataElements.and.returnValue(utils.getPromise(q, datasets));
                    translationsService.translate.and.returnValue(datasets);

                    initialiseController();

                    scope.$apply();
                    scope.selectDataSet(datasets[0]);
                    scope.$apply();

                });

                it("should setup the dataSet correctly", function() {
                    expect(scope.selectedDataset.sections.length).toEqual(1);
                    expect(scope.selectedDataset.sections[0].dataElements.length).toEqual(3);
                });

                it("should enrich the sections with the unGrouped Data Elements", function() {
                    expect(scope.selectedDataset.sections[0].unGroupedDataElements.length).toEqual(1);
                    expect(scope.selectedDataset.sections[0].unGroupedDataElements[0].id).toEqual('DE3');
                });

                it("should enrich the sections with the subSections Elements", function() {
                    expect(scope.selectedDataset.sections[0].subSections.length).toEqual(2);
                    expect(scope.selectedDataset.sections[0].subSections[0].name).toEqual("Food");
                    expect(scope.selectedDataset.sections[0].subSections[0].dataElements.length).toEqual(1);
                    expect(scope.selectedDataset.sections[0].subSections[0].dataElements[0].id).toEqual('DE1');
                    expect(scope.selectedDataset.sections[0].subSections[1].name).toEqual("Drinks");
                    expect(scope.selectedDataset.sections[0].subSections[1].dataElements.length).toEqual(1);
                    expect(scope.selectedDataset.sections[0].subSections[1].dataElements[0].id).toEqual('DE2');
                });

                it('should expand the subsections by default', function() {
                    expect(Object.keys(scope.isSubSectionExpanded)).toEqual(["SEC1"]);
                    expect(Object.keys(scope.isSubSectionExpanded.SEC1)).toEqual(["Food", "Drinks"]);
                    expect(scope.isSubSectionExpanded.SEC1.Food).toBe(true);
                });
            });

            it('should not include section when the subSection is not included', function() {
                var dataElements = [{
                    'isIncluded': true,
                    'isMandatory': false
                }, {
                    'isIncluded': false,
                    'isMandatory': true
                }];
                var subSection = {
                    'isIncluded': false,
                    'dataElements': dataElements
                };
                var section = {
                    'isIncluded': true,
                    'dataElements': dataElements
                };

                scope.changeDataElementSelectionInSubSection(subSection, section);
                expect(subSection.dataElements[0].isIncluded).toBeFalsy();
                expect(section.isIncluded).toBe(false);
            });

            it("should select/de-select all subSections if the section containing it is toggled", function() {
                var section = {
                    'id': "sec1",
                    "subSections": [{
                        'name': "test1",
                        'isIncluded': true
                    }, {
                        'name': "test2",
                        'isIncluded': false
                    }],
                    isIncluded: false
                };

                scope.toggleSelect(section);
                expect(section.subSections[0].isIncluded).toBeTruthy();
                expect(section.subSections[1].isIncluded).toBeTruthy();
                expect(section.isIncluded).toBeTruthy();
            });

            describe('associateReferralLocation', function () {
                it('should set to true if referral location is associated to an existing module', function () {
                    var referralDataset = {
                        id: 'someId',
                        isReferralDataset: true
                    };
                    scope.isNewMode = false;
                    dataSetRepo.findAllForOrgUnits.and.returnValue(utils.getPromise(q, [referralDataset]));
                    initialiseController();
                    scope.$apply();

                    expect(scope.associateReferralLocation).toBeTruthy();
                });
                
                it('should set to false if the referral location is not associated to an existing module', function () {
                    scope.isNewMode = false;
                    dataSetRepo.findAllForOrgUnits.and.returnValue(utils.getPromise(q, []));
                    initialiseController();
                    scope.$apply();

                    expect(scope.associateReferralLocation).toBeFalsy();
                });

                it('should set to true when creating a new module', function () {
                    scope.isNewMode = true;
                    initialiseController();
                    scope.$apply();

                    expect(scope.associateReferralLocation).toBeTruthy();
                });
            });

            describe('associateOriginDataSet', function () {

                it('should set to true if the origins for a module are associated with originDataset for an existing module', function () {
                    scope.isNewMode = false;
                    var mockOrigin = {
                        id: 'someOriginId',
                        dataSets: [{ id: 'someId' }]
                    };
                    orgUnitRepo.findAllByParent.and.returnValue(utils.getPromise(q, [mockOrigin]));
                    initialiseController();
                    scope.$apply();

                    expect(scope.associateOriginDataSet).toBeTruthy();
                });

                it('should set to true when creating a new module', function () {
                    scope.isNewMode = true;
                    initialiseController();
                    scope.$apply();

                    expect(scope.associateOriginDataSet).toBeTruthy();
                });

                it('should not set associateOriginDataSet if geographicOrigin is disabled', function () {
                    scope.geographicOriginDisabled = true;
                    initialiseController();
                    scope.$apply();

                    expect(scope.associateOriginDataSet).toBeUndefined();
                });
            });

        });
    });