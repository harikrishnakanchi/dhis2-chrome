define(["lineListModuleController", "angularMocks", "utils", "testData", "orgUnitGroupHelper", "moment", "timecop", "dhisId", "orgUnitRepository", "dataSetRepository",
    "originOrgunitCreator", "excludedDataElementsRepository", "programRepository", "excludedLineListOptionsRepository", "translationsService", "customAttributes", "orgUnitMapper"
    ],
    function(LineListModuleController, mocks, utils, testData, OrgUnitGroupHelper, moment, timecop, dhisId, OrgUnitRepository,
             DatasetRepository, OriginOrgunitCreator, ExcludedDataElementsRepository, ProgramRepository, ExcludedLineListOptionsRepository, TranslationsService, customAttributes, orgUnitMapper) {

        describe("line list module controller", function() {
            var scope, rootScope, lineListModuleController, mockOrgStore, mockOrigin, db, q, datasets, dataElements,
                orgUnitRepository, hustle, excludedDataElementsRepository, excludedLineListOptionsRepository,
                fakeModal, fakeModalStack, allPrograms, programRepository, datasetRepository, originOrgunitCreator, translationsService;

            var createMockAttribute = function (code, value) {
                return {
                    "attribute": {
                        "code": code
                    },
                    "value": value
                };
            };

            beforeEach(module('hustle'));
            beforeEach(mocks.inject(function($rootScope, $q, $hustle) {
                rootScope = $rootScope;
                scope = $rootScope.$new();

                q = $q;

                mockOrigin = {
                    "id": "originOrgUnit"
                };

                rootScope.startLoading = jasmine.createSpy('startLoading');
                rootScope.stopLoading = jasmine.createSpy('stopLoading');

                hustle = $hustle;
                spyOn(hustle, "publish").and.returnValue(utils.getPromise(q, {}));
                spyOn(hustle, "publishOnce").and.returnValue(utils.getPromise(q, {}));

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

                spyOn(customAttributes, 'createAttribute').and.callFake(function (code, value) {
                    return createMockAttribute(code, value);
                });

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
                spyOn(orgUnitRepository, "get").and.returnValue(utils.getPromise(q, undefined));
                spyOn(orgUnitRepository, "findAllByParent").and.returnValue(utils.getPromise(q, [mockOrigin]));
                spyOn(orgUnitRepository, "associateDataSetsToOrgUnits").and.returnValue(utils.getPromise(q, {}));

                translationsService = new TranslationsService();
                spyOn(translationsService, "translate").and.returnValue([]);

                var allDatasets = [{
                    "id": "Ds1",
                    "isOriginDataset": false
                }, {
                    "id": "OrgDs1",
                    "isOriginDataset": true
                }, {
                    "id": "refDs",
                    "isReferralDataset": true
                }, {
                    "id": "popDs",
                    "isPopulationDataset": true
                }];

                datasetRepository = new DatasetRepository();
                spyOn(datasetRepository, "getAll").and.returnValue(utils.getPromise(q, allDatasets));

                excludedLineListOptionsRepository = new ExcludedLineListOptionsRepository();
                spyOn(excludedLineListOptionsRepository, 'upsert').and.returnValue(utils.getPromise(q, {}));

                orgUnitGroupHelper = new OrgUnitGroupHelper();
                spyOn(orgUnitGroupHelper, "associateModuleAndOriginsToGroups").and.returnValue(utils.getPromise(q, {}));

                spyOn(excludedLineListOptionsRepository, 'get').and.returnValue(utils.getPromise(q, {}));

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

                fakeModalStack = {
                    dismissAll: function () {}
                };

                scope.orgUnit = {
                    'name': 'SomeName',
                    'id': 'someId',
                    "parent": {
                        "id": "blah1"
                    }
                };

                scope.locale = "en";

                scope.resourceBundle = {
                    "upsertOrgUnitDesc": "save organisation unit",
                    "associateOrgUnitToDatasetDesc": "associate datasets for {{orgunit_name}}",
                    "uploadSystemSettingDesc": "upload sys settings for {{module_name}}",
                    "uploadProgramDesc": "associate selected program to {{orgunit_name}}",
                    "uploadExcludedOptionsDesc": "upload excluded options for module"
                };

                scope.isNewMode = true;
                createLineListModuleController();
            }));

            afterEach(function() {
                Timecop.returnToPresent();
                Timecop.uninstall();
            });

            var createLineListModuleController = function () {
                lineListModuleController = new LineListModuleController(scope, rootScope, hustle, orgUnitRepository, excludedDataElementsRepository, q, fakeModal, fakeModalStack, programRepository, orgUnitGroupHelper, datasetRepository, originOrgunitCreator, translationsService, excludedLineListOptionsRepository);
            };

            it("should save sorted list of all programs", function() {
                var program1 = {
                    'id': 'prog1',
                    'name': 'ER Linelist'
                };
                var program2 = {
                    'id': 'prog1',
                    'name': 'Burn Unit'
                };

                programRepository.getAll.and.returnValue([program1, program2]);
                translationsService.translate.and.returnValue([program1, program2]);
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
                            }],
                            'dataElementsWithoutOptions': [],
                            'dataElementsWithOptions':[]
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
                    "openingDate": moment.utc(today).format('YYYY-MM-DD'),
                    "attributeValues": [{
                        "attribute": {
                            "code": "Type"
                        },
                        "value": "Module"
                    }, {
                        "attribute": {
                            "code": "isLineListService"
                        },
                        "value": "true"
                    }, {
                        "attribute": {
                            "code": 'isNewDataModel'
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
                    desc: "save organisation unit"
                }, "dataValues");

                expect(scope.saveFailure).toBe(false);
            });

            describe('excludedLineListOptions', function () {
                var enrichedModule;
                beforeEach(function () {
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

                    var selectedDataElementA = createDataElement({
                        dataElement: {
                            id: 'de3',
                            optionSet: {
                                id: 'someOptionSetId',
                                options: [{
                                    id: 'someOtherOptionId',
                                    isSelected: false
                                }]
                            }
                        }
                    });
                    var selectedDataElementB = createDataElement({
                        dataElement: {
                            id: 'de4',
                            optionSet: {
                                id: 'someOtherOptionSetId',
                                options: [{
                                    id: 'someOptionId',
                                    isSelected: false
                                }, {
                                    id: 'someOtherOptionId',
                                    isSelected:false
                                }]
                            }
                        }
                    });

                    scope.enrichedProgram = createEnrichedProgram([selectedDataElementA, selectedDataElementB]);


                    enrichedModule = {
                        id: 'Module2someId'
                    };

                    spyOn(dhisId, "get").and.callFake(function(name) {
                        return name;
                    });

                    programRepository.getProgramForOrgUnit.and.returnValue(utils.getPromise(q, program));
                    originOrgunitCreator.create.and.returnValue(utils.getPromise(q, originOrgUnit));

                    scope.program = program;
                    programRepository.get.and.returnValue(utils.getPromise(q, program));
                });

                var createEnrichedProgram = function (dataElements) {
                    return {
                        programStages: [{
                            programStageSections: [{
                                dataElementsWithOptions: dataElements

                            }]
                        }]
                    };
                };

                var createDataElement = function (dataElementOptions) {
                    return _.merge({
                        dataElement: {
                            isIncluded: true,
                            id: 'someDataElementId',
                            optionSet: {
                                options: [{
                                    id: 'someOptionId',
                                    isSelected: true
                                }, {
                                    id: 'someOtherOptionId',
                                    isSelected: true
                                }]
                            }
                        }
                    }, dataElementOptions);
                };

                it("should save excluded line list options for new module", function() {
                    scope.save();
                    scope.$apply();

                    var excludedLineListOptions = {
                        moduleId: enrichedModule.id,
                        clientLastUpdated: moment().toISOString(),
                        dataElements: [{
                            dataElementId: 'de3',
                            optionSetId: 'someOptionSetId',
                            excludedOptionIds: ['someOtherOptionId']
                        }, {
                            dataElementId: 'de4',
                            optionSetId: 'someOtherOptionSetId',
                            excludedOptionIds: ['someOptionId', 'someOtherOptionId']
                        }]
                    };

                    expect(excludedLineListOptionsRepository.upsert).toHaveBeenCalledWith(excludedLineListOptions);
                    expect(hustle.publishOnce).toHaveBeenCalledWith({
                        "data": enrichedModule.id,
                        "type": "uploadExcludedOptions",
                        "locale": "en",
                        "desc": scope.resourceBundle.uploadExcludedOptionsDesc
                    }, "dataValues");
                });

                it('should update excluded line list options for existing module', function () {
                    scope.update(scope.module);
                    scope.$apply();

                    var excludedLineListOptions = {
                        moduleId: scope.module.id,
                        clientLastUpdated: moment().toISOString(),
                        dataElements: [{
                            dataElementId: 'de3',
                            optionSetId: 'someOptionSetId',
                            excludedOptionIds: ['someOtherOptionId']
                        }, {
                            dataElementId: 'de4',
                            optionSetId: 'someOtherOptionSetId',
                            excludedOptionIds: ['someOptionId', 'someOtherOptionId']
                        }]
                    };

                    expect(excludedLineListOptionsRepository.upsert).toHaveBeenCalledWith(excludedLineListOptions);
                    expect(hustle.publishOnce).toHaveBeenCalledWith({
                        "data": scope.module.id,
                        "type": "uploadExcludedOptions",
                        "locale": "en",
                        "desc": scope.resourceBundle.uploadExcludedOptionsDesc
                    }, "dataValues");
                });

                it("should save the empty excluded line list option if no option was unSelected", function () {
                    var selectedDataElement = createDataElement({dataElement: {id: 'de3'}});
                    scope.enrichedProgram = createEnrichedProgram([selectedDataElement]);

                    scope.save();
                    scope.$apply();

                    var excludedLineListOptions = {
                        moduleId: enrichedModule.id,
                        clientLastUpdated: moment().toISOString(),
                        dataElements: []
                    };
                    expect(excludedLineListOptionsRepository.upsert).toHaveBeenCalledWith(excludedLineListOptions);
                });

                it("should not save excluded line list option if data element is unSelected", function () {
                    var unSelectedDataElementA = createDataElement({
                        dataElement: {
                            isIncluded: false,
                            id: 'de3',
                            optionSet: {
                                id: 'someOptionId',
                                options: [{
                                    id: 'someOtherOptionId',
                                    isSelected: false
                                }]
                            }
                        }
                    });
                    var selectedDataElementB = createDataElement({
                        dataElement: {
                            id: 'de4',
                            optionSet: {
                                id: 'someOtherOptionId',
                                options: [{
                                    id: 'someOptionId',
                                    isSelected: false
                                }, {
                                    id: 'someOtherOptionId',
                                    isSelected: false
                                }]
                            }
                        }
                    });
                    scope.enrichedProgram = createEnrichedProgram([unSelectedDataElementA, selectedDataElementB]);

                    scope.save();
                    scope.$apply();

                    var excludedLineListOptions = {
                        moduleId: enrichedModule.id,
                        clientLastUpdated: moment().toISOString(),
                        dataElements: [{
                            dataElementId: selectedDataElementB.dataElement.id,
                            optionSetId: 'someOtherOptionId',
                            excludedOptionIds: ['someOptionId', 'someOtherOptionId']
                        }]
                    };
                    expect(excludedLineListOptionsRepository.upsert).toHaveBeenCalledWith(excludedLineListOptions);
                });
            });

            describe('onOptionSelectionChange', function () {
                beforeEach(function () {
                    spyOn(fakeModal, "open").and.returnValue({
                        result: utils.getPromise(q, {})
                    });
                });

                describe('atleast two options are not selected', function () {
                    var mockOptionSet, mockOption;

                    beforeEach(function () {
                        mockOption = {isSelected: false};
                        mockOptionSet = {options: [mockOption, {isSelected: true}]};
                        scope.onOptionSelectionChange(mockOptionSet, mockOption);
                    });

                    it('should show modal with a message', function () {
                        expect(fakeModal.open).toHaveBeenCalled();
                    });

                    it('should reselect the option', function () {
                        expect(mockOption.isSelected).toBe(true);
                    });
                });

                it('should not show modal with a message if atleast two options are selected', function () {
                    var mockOptionSet = {options: [{isSelected: false}, {isSelected: true}, {isSelected: true}]};
                    scope.onOptionSelectionChange(mockOptionSet);
                    expect(fakeModal.open).not.toHaveBeenCalled();
                });
            });

            describe('init', function () {

                describe('for existing module', function () {
                    var program, moduleId;

                    beforeEach(function () {
                        moduleId = 'Module2';
                        program = {
                            programStages: [{
                                programStageSections: [{
                                    programStageDataElements: [{
                                        dataElement: {
                                            isIncluded: true,
                                            id: 'someDataElementId',
                                            optionSet: {
                                                options: [{
                                                    id: 'someOptionId'
                                                }, {
                                                    id: 'someOtherOptionId'
                                                }]
                                            }
                                        }
                                    }]
                                }]
                            }]
                        };

                        programRepository.getProgramForOrgUnit.and.returnValue(utils.getPromise(q, program));
                        programRepository.get.and.returnValue(utils.getPromise(q, program));
                        translationsService.translate.and.returnValue(program);
                    });

                    it('should get excludedLineListOptions', function () {
                        var excludedLineListOptions = {
                            dataElements: []
                        };
                        excludedLineListOptionsRepository.get.and.returnValue(utils.getPromise(q, excludedLineListOptions));

                        createLineListModuleController();
                        scope.module.id = 'someModuleId';
                        scope.$apply();

                        expect(excludedLineListOptionsRepository.get).toHaveBeenCalledWith(scope.module.id);
                        expect(scope.excludedLineListOptions).toBe(excludedLineListOptions);
                    });

                    it('should enrich the program dataElements with the excluded line list options', function () {
                        var excludedLineListOptions = {
                            moduleId: moduleId,
                            dataElements: [{
                                dataElementId: 'someDataElementId',
                                excludedOptionIds: ['someOptionId']
                            }]
                        };
                        excludedLineListOptionsRepository.get.and.returnValue(utils.getPromise(q, excludedLineListOptions));

                        createLineListModuleController();
                        scope.module = {
                            'id': moduleId,
                            'parent': scope.orgUnit
                        };
                        scope.$apply();

                        var expectedProgram = {
                            programStages: [{
                                programStageSections: [{
                                    programStageDataElements: [{
                                        dataElement: {
                                            isIncluded: true,
                                            id: 'someDataElementId',
                                            optionSet: {
                                                options: [{
                                                    id: 'someOptionId',
                                                    isSelected: false
                                                }, {
                                                    id: 'someOtherOptionId',
                                                    isSelected: true
                                                }]
                                            }
                                        }
                                    }],
                                    dataElementsWithoutOptions: [],
                                    dataElementsWithOptions: [{
                                        dataElement: {
                                            isIncluded: true,
                                            id: 'someDataElementId',
                                            optionSet: {
                                                options: [{
                                                    id: 'someOptionId',
                                                    isSelected: false
                                                }, {
                                                    id: 'someOtherOptionId',
                                                    isSelected: true
                                                }]
                                            }
                                        }
                                    }]
                                }]
                            }]
                        };
                        expect(scope.enrichedProgram).toEqual(expectedProgram);
                    });

                    it('should enrich the program dataElements as all options are selected if no excluded line list options are available', function () {
                        excludedLineListOptionsRepository.get.and.returnValue(utils.getPromise(q, undefined));

                        createLineListModuleController();
                        scope.module = {
                            'id': moduleId,
                            'parent': scope.orgUnit
                        };
                        scope.$apply();

                        var expectedProgram = {
                            programStages: [{
                                programStageSections: [{
                                    programStageDataElements: [{
                                        dataElement: {
                                            isIncluded: true,
                                            id: 'someDataElementId',
                                            optionSet: {
                                                options: [{
                                                    id: 'someOptionId',
                                                    isSelected: true
                                                }, {
                                                    id: 'someOtherOptionId',
                                                    isSelected: true
                                                }]
                                            }
                                        }
                                    }],
                                    dataElementsWithoutOptions: [],
                                    dataElementsWithOptions: [{
                                        dataElement: {
                                            isIncluded: true,
                                            id: 'someDataElementId',
                                            optionSet: {
                                                options: [{
                                                    id: 'someOptionId',
                                                    isSelected: true
                                                }, {
                                                    id: 'someOtherOptionId',
                                                    isSelected: true
                                                }]
                                            }
                                        }
                                    }]
                                }]
                            }]
                        };
                        expect(scope.enrichedProgram).toEqual(expectedProgram);
                    });

                    it('should enrich the program dataElement as all options are selected if no excluded line list options are available for a dataElement', function () {
                        var excludedLineListOptions = {
                            moduleId: moduleId,
                            dataElements: [{
                            }]
                        };
                        excludedLineListOptionsRepository.get.and.returnValue(utils.getPromise(q, excludedLineListOptions));

                        createLineListModuleController();
                        scope.module = {
                            'id': moduleId,
                            'parent': scope.orgUnit
                        };
                        scope.$apply();

                        var expectedProgram = {
                            programStages: [{
                                programStageSections: [{
                                    programStageDataElements: [{
                                        dataElement: {
                                            isIncluded: true,
                                            id: 'someDataElementId',
                                            optionSet: {
                                                options: [{
                                                    id: 'someOptionId',
                                                    isSelected: true
                                                }, {
                                                    id: 'someOtherOptionId',
                                                    isSelected: true
                                                }]
                                            }
                                        }
                                    }],
                                    dataElementsWithoutOptions: [],
                                    dataElementsWithOptions: [{
                                        dataElement: {
                                            isIncluded: true,
                                            id: 'someDataElementId',
                                            optionSet: {
                                                options: [{
                                                    id: 'someOptionId',
                                                    isSelected: true
                                                }, {
                                                    id: 'someOtherOptionId',
                                                    isSelected: true
                                                }]
                                            }
                                        }
                                    }]
                                }]
                            }]
                        };
                        expect(scope.enrichedProgram).toEqual(expectedProgram);
                    });

                });

                it('should not get excludedLineListOptions for the newly creating module', function () {
                    scope.$apply();
                    expect(excludedLineListOptionsRepository.get).not.toHaveBeenCalled();
                });

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
                        "attributeValues": []
                    }],
                    "attributeValues": []
                };
                scope.isNewMode = false;
                programRepository.getProgramForOrgUnit.and.returnValue(utils.getPromise(q, program));
                programRepository.get.and.returnValue(utils.getPromise(q, program));
                translationsService.translate.and.returnValue(program);
                spyOn(customAttributes, 'getBooleanAttributeValue').and.returnValue(true);

                createLineListModuleController();

                scope.$apply();
                expect(scope.isDisabled).toBeTruthy();
            });

            it("should update system setting while updating module", function() {
                scope.$apply();

                scope.isNewMode = false;
                createLineListModuleController();
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
                            }],
                            'dataElementsWithOptions': [{
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
                    "openingDate": moment.utc(new Date()).format('YYYY-MM-DD'),
                    "attributeValues": [{
                        "attribute": {
                            "code": "Type"
                        },
                        "value": "Module"
                    }, {
                        "attribute": {
                            "code": "isLineListService"
                        },
                        "value": "true"
                    }, {
                        "attribute": {
                            "code": 'isNewDataModel'
                        },
                        "value": 'true'
                    }],
                    "parent": parent
                };

                scope.isNewMode = false;

                createLineListModuleController();
                scope.update(module);
                scope.$apply();

                expect(orgUnitRepository.upsert).toHaveBeenCalledWith(enrichedLineListModule);
                expect(hustle.publish).toHaveBeenCalledWith({
                    data: enrichedLineListModule,
                    type: "upsertOrgUnit",
                    locale: "en",
                    desc: "save organisation unit"
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

                createLineListModuleController();
                scope.disable(module);
                scope.$apply();

                expect(disablesAttInDb.value).toEqual("true");
                expect(disableAttrInHustle.value).toEqual("true");
                expect(scope.$parent.closeNewForm).toHaveBeenCalledWith(module, "disabledModule");
            });

            describe('onProgramSelect', function () {

                var selectedObject, program, programStageDataElementA, programStageDataElementB, programStageDataElementC;

                var createProgramStageDataElement = function (options) {
                    return _.merge({
                        id: 'programStageDataElementId',
                        "dataElement": {
                            "id": "de1"
                        }
                    }, options);
                };

                beforeEach(function () {
                    programStageDataElementA = createProgramStageDataElement({'dataElement': {
                        optionSet: {
                            options: [{
                                id: 'someOptionId'
                            }, {
                                id: 'someOtherOptionId'
                            }]
                        }
                    }});
                    programStageDataElementB = createProgramStageDataElement({'dataElement': {
                        optionSet: {
                            options: [{
                                id: 'someOptionId'
                            }, {
                                id: 'someOtherOptionId'
                            }]
                        }
                    }});
                    programStageDataElementC = createProgramStageDataElement();

                    program = {
                        "id": "surgery1",
                        "name": "Surgery",
                        "programStages": [{
                            "programStageSections": [{
                                "id": "sectionId1",
                                "programStageDataElements": [programStageDataElementA, programStageDataElementB, programStageDataElementC]
                            }, {
                                "id": "sectionId2",
                                "programStageDataElements": [programStageDataElementC]
                            }]
                        }]
                    };

                    selectedObject = {
                        "originalObject": program
                    };

                    programRepository.getProgramForOrgUnit.and.returnValue(utils.getPromise(q, program));
                    programRepository.get.and.returnValue(utils.getPromise(q, program));
                    translationsService.translate.and.returnValue(program);
                });

                it('should group dataElements with optionSet and set it to that programStageSection', function () {
                    scope.onProgramSelect(selectedObject).then(function(data) {
                        expect(scope.enrichedProgram.programStages[0].programStageSections[0].dataElementsWithOptions).toEqual([programStageDataElementA,programStageDataElementB]);
                    });
                    scope.$apply();
                });

                it('should group dataElements without optionSet and set it to that programStageSection', function () {
                    scope.onProgramSelect(selectedObject).then(function(data) {
                        expect(scope.enrichedProgram.programStages[0].programStageSections[0].dataElementsWithoutOptions).toEqual([programStageDataElementC]);
                    });
                    scope.$apply();
                });

                it('should group referral location dataElement into data dataElements without optionSet', function () {
                    var programStageDataElement = createProgramStageDataElement({
                        dataElement: {
                            offlineSummaryType: "referralLocations",
                            optionSet: {
                                options: [{
                                    id: 'someOptionId'
                                }, {
                                    id: 'someOtherOptionId'
                                }]
                            }
                        }
                    });
                    program = {
                        "id": "surgery1",
                        "name": "Surgery",
                        "programStages": [{
                            "programStageSections": [{
                                "id": "sectionId1",
                                "programStageDataElements": [programStageDataElement]
                            }]
                        }]
                    };

                    selectedObject = {
                        "originalObject": program
                    };

                    programRepository.getProgramForOrgUnit.and.returnValue(utils.getPromise(q, program));
                    programRepository.get.and.returnValue(utils.getPromise(q, program));
                    translationsService.translate.and.returnValue(program);

                    scope.onProgramSelect(selectedObject).then(function(data) {
                        expect(scope.enrichedProgram.programStages[0].programStageSections[0].dataElementsWithoutOptions).toEqual([programStageDataElement]);
                    });
                    scope.$apply();
                });

                it("should set program on scope", function() {
                    scope.onProgramSelect(selectedObject).then(function(data) {
                        expect(scope.enrichedProgram).toEqual(program);
                        expect(scope.collapseSection).toEqual({
                            sectionId1: false,
                            sectionId2: true
                        });
                    });
                    scope.$apply();
                });

                it('should mark all the dataElementOptions as selected for the newly creating module', function () {
                    var programStageDataElementWithOptionSelectedA, programStageDataElementWithOptionSelectedB;

                    scope.onProgramSelect(selectedObject).then(function(data) {
                        programStageDataElementWithOptionSelectedA = createProgramStageDataElement({'dataElement': {
                            optionSet: {
                                options: [{
                                    id: 'someOptionId',
                                    isSelected: true
                                }, {
                                    id: 'someOtherOptionId',
                                    isSelected: true
                                }]
                            }
                        }});
                        programStageDataElementWithOptionSelectedB = createProgramStageDataElement({'dataElement': {
                            optionSet: {
                                options: [{
                                    id: 'someOptionId',
                                    isSelected: true
                                }, {
                                    id: 'someOtherOptionId',
                                    isSelected: true
                                }]
                            }
                        }});

                        expect(scope.enrichedProgram.programStages[0].programStageSections[0].dataElementsWithOptions)
                            .toEqual([programStageDataElementWithOptionSelectedA, programStageDataElementWithOptionSelectedB]);
                    });
                    scope.$apply();
                });

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

            it("should create origin org units when geographic origin is enabled", function() {
                scope.geographicOriginDisabled = false;
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
                    "openingDate": moment.utc().format('YYYY-MM-DD'),
                    "attributeValues": [{
                        "attribute": {
                            "code": "Type"
                        },
                        "value": "Module"
                    }, {
                        "attribute": {
                            "code": "isLineListService"
                        },
                        "value": "true"
                    }, {
                        "attribute": {
                            "code": 'isNewDataModel'
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
                expect(hustle.publish.calls.argsFor(2)).toEqual([{
                    "data": originOrgUnit,
                    "type": "upsertOrgUnit",
                    "locale": "en",
                    "desc": "save organisation unit"
                }, "dataValues"]);
            });

            it("should associate origin org units to programs and datasets and publish jobs accordingly when geographic origin is enabled", function() {
                scope.geographicOriginDisabled = false;
                scope.$apply();

                scope.module = {
                    'id': "someModuleId",
                    'name': "someModuleName",
                    'parent': scope.orgUnit
                };

                var program = {
                    'id': 'someProgramId',
                    'name': 'someProgramName',
                };

                var originOrgUnit = [{
                    "name": "someOriginName",
                    "id": "someOriginId",
                }];

                var messageData = {
                    programIds: [program.id],
                    orgUnitIds: [originOrgUnit[0].id]
                };

                programRepository.getProgramForOrgUnit.and.returnValue(utils.getPromise(q, program));
                originOrgunitCreator.create.and.returnValue(utils.getPromise(q, originOrgUnit));

                scope.program = program;
                programRepository.get.and.returnValue(utils.getPromise(q, program));
                spyOn(customAttributes, 'getAttributeValue').and.returnValue('Ds1');

                scope.save();
                scope.$apply();

                expect(programRepository.associateOrgUnits).toHaveBeenCalledWith(program, originOrgUnit);
                expect(orgUnitRepository.associateDataSetsToOrgUnits).toHaveBeenCalledWith(["Ds1", "OrgDs1"], originOrgUnit);
                expect(hustle.publish.calls.argsFor(3)).toEqual([{
                    data: messageData,
                    type: "associateOrgunitToProgram",
                    locale: "en",
                    desc: "associate selected program to " + originOrgUnit[0].name
                }, "dataValues"]);

                expect(hustle.publish.calls.argsFor(4)).toEqual([{
                    data: {"orgUnitIds":["someOriginId"], "dataSetIds":["Ds1", "OrgDs1"]},
                    type: "associateOrgUnitToDataset",
                    locale: "en",
                    desc: "associate datasets for SomeName"
                }, "dataValues"]);

            });

            it("should associate module to program when geographicOrigin is disabled", function() {
                var today = new Date();
                scope.geographicOriginDisabled = true;
                scope.$apply();

                scope.module = {
                    'id': "someModuleId",
                    'name': "someModuleName",
                    'openingDate': today,
                    'serviceType': "Linelist",
                    'parent': scope.orgUnit
                };

                var program = {
                    'id': 'someProgramId',
                    'name': 'someProgramName',
                    'organisationUnits': [],
                    'attributeValues': []
                };

                var messageData = {
                    programIds: [program.id],
                    orgUnitIds: [scope.module.id]
                };

                programRepository.getProgramForOrgUnit.and.returnValue(utils.getPromise(q, program));
                spyOn(orgUnitMapper, 'mapToModule').and.returnValue(scope.module);

                scope.program = program;
                programRepository.get.and.returnValue(utils.getPromise(q, program));

                scope.save();
                scope.$apply();

                expect(programRepository.associateOrgUnits).toHaveBeenCalledWith(program, [scope.module]);
                expect(hustle.publish.calls.argsFor(2)).toEqual([{
                    data: messageData,
                    type: "associateOrgunitToProgram",
                    locale: "en",
                    desc: "associate selected program to "+ scope.module.name
                }, "dataValues"]);
            });

            describe('DataSetsModuleAssociation', function () {
                beforeEach(function () {
                    scope.module = {
                        'id': "someModuleId",
                        'name': "someModuleName",
                        'displayName': 'someModuleName',
                        'parent': scope.orgUnit
                    };

                    var program = {
                        'id': 'someProgramId',
                        'name': 'someProgramName'
                    };

                    programRepository.getProgramForOrgUnit.and.returnValue(utils.getPromise(q, program));

                    scope.program = program;
                    programRepository.get.and.returnValue(utils.getPromise(q, program));
                    spyOn(customAttributes, 'getAttributeValue').and.returnValue('Ds1');
                    spyOn(orgUnitMapper, 'mapToModule').and.returnValue(scope.module);
                });

                it("should associate line list summary datasets along with population and referral dataSets to modules and publish jobs accordingly when geographic origin is disabled", function() {
                    scope.geographicOriginDisabled = true;

                    scope.save();
                    scope.$apply();

                    expect(orgUnitRepository.associateDataSetsToOrgUnits).toHaveBeenCalledWith(["popDs", "refDs", "Ds1"], [scope.module]);

                    expect(hustle.publish.calls.argsFor(3)).toEqual([{
                        data: {"orgUnitIds":["someModuleId"], "dataSetIds":["popDs", "refDs", "Ds1"]},
                        type: "associateOrgUnitToDataset",
                        locale: "en",
                        desc: "associate datasets for " + scope.module.displayName
                    }, "dataValues"]);
                });

                it("should associate only population and referral datasets to modules and publish jobs accordingly when geographic origin is enabled", function() {
                    scope.geographicOriginDisabled = false;

                    scope.save();
                    scope.$apply();

                    var expectedDataSetIds = ["popDs", "refDs"];
                    expect(orgUnitRepository.associateDataSetsToOrgUnits).toHaveBeenCalledWith(expectedDataSetIds, [scope.module]);

                    expect(hustle.publish.calls.argsFor(5)).toEqual([{
                        data: {"orgUnitIds": ["someModuleId"], "dataSetIds": expectedDataSetIds},
                        type: "associateOrgUnitToDataset",
                        locale: "en",
                        desc: "associate datasets for " + scope.module.displayName
                    }, "dataValues"]);
                });
            });

            describe('OrgUnitGroupsAssociation', function () {
                beforeEach(function () {
                    scope.module = {
                        'id': "someModuleId",
                        'name': "someModuleName",
                        'parent': scope.orgUnit
                    };
                });

                it("should associate to origins when geographicOrigin is enabled", function() {
                    scope.geographicOriginDisabled = false;
                    var originOrgUnit = [{
                        "name": "someOriginName",
                        "id": "someOriginId"
                    }];

                    originOrgunitCreator.create.and.returnValue(utils.getPromise(q, originOrgUnit));

                    scope.save();
                    scope.$apply();

                    expect(orgUnitGroupHelper.associateModuleAndOriginsToGroups).toHaveBeenCalledWith(originOrgUnit);
                });

                it("should associate to modules when geographicOrigin is disabled", function () {
                    scope.geographicOriginDisabled = true;

                    spyOn(orgUnitMapper, 'mapToModule').and.returnValue(scope.module);

                    scope.save();
                    scope.$apply();

                    expect(orgUnitGroupHelper.associateModuleAndOriginsToGroups).toHaveBeenCalledWith([scope.module]);
                });
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

            describe('FindAssociatiedProgram', function () {
                beforeEach(function () {
                    scope.module = {
                        id: 'someModule',
                        parent: scope.orgUnit
                    };
                });

                it("should find the program association from module when geographicOrigin is disabled", function () {
                    scope.geographicOriginDisabled = true;
                    scope.$apply();

                    expect(programRepository.getProgramForOrgUnit).toHaveBeenCalledWith(scope.module.id);
                });

                it("should find the program associated from the origin when geographicOrigin is enabled", function () {
                    scope.geographicOriginDisabled = false;
                    scope.$apply();

                    expect(programRepository.getProgramForOrgUnit).toHaveBeenCalledWith(mockOrigin.id);
                });
            });
        });
    });
