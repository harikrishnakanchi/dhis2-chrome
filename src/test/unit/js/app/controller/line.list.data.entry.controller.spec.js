define(["lineListDataEntryController", "angularMocks", "utils", "moment", "timecop", "programEventRepository", "optionSetRepository", "orgUnitRepository",
    "excludedDataElementsRepository", "programRepository", "translationsService", "historyService", "excludedLineListOptionsRepository", "customAttributes"],
    function(LineListDataEntryController, mocks, utils, moment, timecop, ProgramEventRepository, OptionSetRepository, OrgUnitRepository,
             ExcludedDataElementsRepository, ProgramRepository, TranslationsService, HistoryService, ExcludedLineListOptionsRepository, customAttributes) {
        describe("lineListDataEntryController ", function() {

            var scope, lineListDataEntryController, q, routeParams, rootScope, programEventRepository, originOrgUnits,
                mockModule, mockProgram, optionSetRepository, orgUnitRepository, excludedDataElementsRepository, programRepository, route, translationsService, historyService, excludedLineListOptionsRepository;

            beforeEach(module('hustle'));
            beforeEach(mocks.inject(function($rootScope, $q) {
                scope = $rootScope.$new();
                rootScope = $rootScope;
                q = $q;

                route = {
                    reload: jasmine.createSpy('reload')
                };

                scope.resourceBundle = {};

                rootScope.startLoading = jasmine.createSpy('startLoading');
                rootScope.stopLoading = jasmine.createSpy('stopLoading');

                routeParams = {
                    'eventId': 'event1',
                    'module': 'mod1',
                    'returnTo': '/line-list-summary/mod1'
                };

                var ev = {
                    "event": "event1",
                    "dataValues": [{
                        "name": "Case Number - Measles Outbreak",
                        "value": "66",
                        "dataElement": "de1"
                    }]
                };

                var optionSets = [{
                    "id": "os1",
                    "options": [{
                        "id": 'os1o1',
                        "code": 'os1o1',
                        "name": 'os1o1 name',
                        "isDisabled": false
                    }, {
                        "id": 'os1o2',
                        "code": 'os1o2',
                        "name": 'os1o2 name',
                        "isDisabled": true
                    }, {
                        "id": 'os1o3',
                        "code": 'os1o3',
                        "name": 'os1o3 name',
                        "isDisabled": false
                    }]
                }, {
                    "id": "os2",
                    options: [{
                        "id": 'os2o1',
                        "code": 'os2o1',
                        "name": 'os2o1 name',
                        "isDisabled": false
                    }]
                }];

                programEventRepository = new ProgramEventRepository();
                spyOn(programEventRepository, "upsert").and.returnValue(utils.getPromise(q, []));
                spyOn(programEventRepository, "findEventById").and.returnValue(utils.getPromise(q, [ev]));

                optionSetRepository = new OptionSetRepository();
                spyOn(optionSetRepository, "getOptionSets").and.returnValue(utils.getPromise(q, optionSets));

                historyService = new HistoryService();
                spyOn(historyService, "back");

                mockModule = {
                    "id": "mod1",
                    "name": "Mod 1",
                    "openingDate": "2015-06-01",
                    "parent": {
                        "id": "par"
                    }
                };

                originOrgUnits = [{
                    "id": "o1",
                    "name": "o1"
                }, {
                    "id": "o2",
                    "name": "o2"
                }];

                orgUnitRepository = new OrgUnitRepository();
                spyOn(orgUnitRepository, "get").and.returnValue(utils.getPromise(q, mockModule));
                spyOn(orgUnitRepository, "findAllByParent").and.returnValue(utils.getPromise(q, originOrgUnits));
                spyOn(orgUnitRepository, "getParentProject").and.returnValue(utils.getPromise(q, {}));

                excludedDataElementsRepository = new ExcludedDataElementsRepository();
                spyOn(excludedDataElementsRepository, "get").and.returnValue(utils.getPromise(q, {}));

                mockProgram = {
                    "id": "Prg1",
                    'programStages': [{
                        'id': 'PrgStage1',
                        'programStageSections': [{
                            'id': 'section1',
                            'programStageDataElements': [{
                                "dataElement": {
                                    "id": "de1",
                                    "valueType": "DATE",
                                    'attributeValues': [{
                                        'attribute': {
                                            'code': 'useAsEventDate'
                                        },
                                        'value': 'true'
                                    }]
                                }
                            }, {
                                "compulsory": true,
                                "dataElement": {
                                    "id": "de2",
                                    "valueType": "TEXT"
                                }
                            }]
                        }, {
                            'id': 'section2',
                            'programStageDataElements': [{
                                "dataElement": {
                                    "id": "de3",
                                    "valueType": "DATE"
                                }
                            }, {
                                "dataElement": {
                                    "id": "de4",
                                    "valueType": "TEXT",
                                    "optionSet": {
                                        "id": "os1"
                                    }
                                }
                            }, {
                                "dataElement": {
                                    "id": "de5",
                                    "valueType": "DATETIME"
                                }
                            }, {
                                "dataElement": {
                                    "id": "de6",
                                    "valueType": "TEXT",
                                    "optionSet": {
                                        "id": "os2"
                                    }
                                }
                            }]
                        }]
                    }]
                };

                programRepository = new ProgramRepository();
                spyOn(programRepository, "getProgramForOrgUnit").and.returnValue(utils.getPromise(q, mockProgram));
                spyOn(programRepository, "get").and.returnValue(utils.getPromise(q, mockProgram));

                translationsService = new TranslationsService();
                spyOn(translationsService, "translate").and.callFake(function (o) {
                    return o;
                });

                excludedLineListOptionsRepository = new ExcludedLineListOptionsRepository();
                spyOn(excludedLineListOptionsRepository, 'get').and.returnValue(utils.getPromise(q, []));

                Timecop.install();
                Timecop.freeze(new Date("2014-10-29T12:43:54.972Z"));
            }));

            afterEach(function() {
                Timecop.returnToPresent();
                Timecop.uninstall();
            });

            var initializeController = function () {
                lineListDataEntryController = new LineListDataEntryController(scope, rootScope, routeParams, route, historyService, programEventRepository, optionSetRepository, orgUnitRepository, excludedDataElementsRepository, programRepository, translationsService);
                scope.$apply();
            };

            describe('init', function () {
                beforeEach(function () {
                    var ev = {
                        "event": "event1",
                        "dataValues": [{
                            "name": "Case Number - Measles Outbreak",
                            "type": "TEXT",
                            "value": "66",
                            "dataElement": "de1"
                        }, {
                            "name": "Date of admission - Measles Outbreak",
                            "type": "DATE",
                            "value": "2015-04-15",
                            "dataElement": "de2"
                        }, {
                            "name": "Age at visit - Measles Outbreak",
                            "type": "INTEGER",
                            "value": 3,
                            "dataElement": "de3"
                        }, {
                            "name": "Sex - Measles Outbreak",
                            "type": "TEXT",
                            "value": "os1o1",
                            "dataElement": "de4"
                        }]
                    };
                    programEventRepository.findEventById.and.returnValue(utils.getPromise(q, [ev]));
                });

                it("should set scope variables on init", function() {
                    initializeController();

                    expect(scope.selectedModuleId).toBeDefined();
                    expect(scope.selectedModuleName).toBeDefined();
                    expect(scope.originOrgUnits).toBeDefined();
                    expect(scope.program).toBeDefined();
                });

                it("should load dataValues on init", function () {
                    initializeController();

                    expect(scope.dataValues).toEqual({
                        'de1': '66',
                        'de2': "2015-04-15",
                        'de3': 3,
                        'de4': jasmine.objectContaining({
                            'id': 'os1o1'
                        })
                    });
                });

                describe('dataElementOptions', function () {

                    it('should set dataElementOptions to scope', function () {
                        var option = {'id': 'os1o1'};
                        var anotherOption = {'id': 'os1o3'};

                        initializeController();

                        expect(scope.dataElementOptions).toBeDefined();
                        expect(Object.keys(scope.dataElementOptions)).toContain("de4");
                        expect(scope.dataElementOptions.de4).toContain(jasmine.objectContaining(option));
                        expect(scope.dataElementOptions.de4).toContain(jasmine.objectContaining(anotherOption));
                    });

                    it('should filter out the excluded options from the dataElementOptions', function () {
                        initializeController();

                        expect(scope.dataElementOptions.de4).not.toContain(jasmine.objectContaining({id: 'os1o2'}));
                    });

                    it('should not filter out the excluded option from the dataElementOptions if the selected option for data element is in the list of excluded options', function () {
                        var ev = {
                            "dataValues": [{
                                "value": "os1o2",
                                "dataElement": "de4"
                            }]
                        };
                        programEventRepository.findEventById.and.returnValue(utils.getPromise(q, [ev]));

                        initializeController();

                        expect(scope.dataElementOptions.de4).toContain(jasmine.objectContaining({id: 'os1o2'}));
                    });

                    it('should set all the dataElementOptions if there are no excluded options for a data element', function () {
                        var ev = {
                            "dataValues": [{
                                "value": "os2o1",
                                "dataElement": "de6"
                            }]
                        };
                        programEventRepository.findEventById.and.returnValue(utils.getPromise(q, [ev]));
                        initializeController();

                        expect(scope.dataElementOptions.de6).toContain(jasmine.objectContaining({id: 'os2o1'}));

                    });
                });

                it('should get Program from module if geographic origin is disabled', function () {
                    orgUnitRepository.findAllByParent.and.returnValue(utils.getPromise(q, []));
                    initializeController();

                    expect(programRepository.getProgramForOrgUnit).toHaveBeenCalledWith(mockModule.id);
                });
            });

            describe('save', function () {
                beforeEach(function () {
                    initializeController();
                });

                it("should save event details as newDraft and show summary view", function() {
                    scope.dataValues = {
                        'de1': "2015-02-03",
                        'de2': "someValue",
                        'de3': moment.utc('2015-02-04').toDate(),
                        'de4': {
                            'id': 'os1o1',
                            'code': 'os1o1',
                            'name': 'os1o1 name'
                        },
                        'de5': moment('2015-02-05 20:00:00').toDate(),
                        'de6': {
                            'id': 'os2o1',
                            'code': 'os2o1'
                        }
                    };

                    scope.orgUnitAssociatedToEvent = originOrgUnits[0];


                    scope.save();
                    scope.$apply();

                    var actualUpsertedEvent = programEventRepository.upsert.calls.first().args[0];

                    expect(actualUpsertedEvent.program).toEqual("Prg1");
                    expect(actualUpsertedEvent.programStage).toEqual("PrgStage1");
                    expect(actualUpsertedEvent.orgUnit).toEqual(originOrgUnits[0].id);
                    expect(actualUpsertedEvent.orgUnitName).toEqual(originOrgUnits[0].name);
                    expect(actualUpsertedEvent.eventDate).toEqual("2015-02-03");
                    expect(actualUpsertedEvent.localStatus).toEqual("NEW_DRAFT");
                    expect(actualUpsertedEvent.dataValues).toEqual([{
                        "dataElement": 'de1',
                        "value": '2015-02-03'
                    }, {
                        "dataElement": 'de2',
                        "value": 'someValue'
                    }, {
                        "dataElement": 'de3',
                        "value": '2015-02-04'
                    }, {
                        "dataElement": 'de4',
                        "value": 'os1o1'
                    }, {
                        "dataElement": 'de5',
                        "value": moment('2015-02-05 20:00:00').toISOString()
                    }, {
                        "dataElement": 'de6',
                        "value": 'os2o1'
                    }]);
                    expect(historyService.back).toHaveBeenCalledWith({
                        "messageType": "success",
                        "message": scope.resourceBundle.eventSaveSuccess
                    });
                });

                it("should save event details as newDraft and show data entry form again", function() {
                    scope.orgUnitAssociatedToEvent = originOrgUnits[0];
                    scope.eventDates = {
                        "Prg1": {
                            "PrgStage1": "2014-11-18T10:34:14.067Z"
                        }
                    };

                    scope.save(true);

                    scope.$apply();

                    expect(historyService.back).not.toHaveBeenCalled();
                    expect(route.reload).toHaveBeenCalled();
                });

                it("should save incomplete events", function() {
                    scope.dataValues = {
                        'de1': "2015-02-03",
                        'de2': undefined,
                        'de3': moment.utc('2015-04-16').toDate(),
                        'de4': undefined
                    };
                    scope.orgUnitAssociatedToEvent = originOrgUnits[0];
                    scope.save();
                    scope.$apply();

                    var actualUpsertedEvent = programEventRepository.upsert.calls.first().args[0];

                    expect(actualUpsertedEvent.program).toEqual("Prg1");
                    expect(actualUpsertedEvent.programStage).toEqual("PrgStage1");
                    expect(actualUpsertedEvent.orgUnit).toEqual("o1");
                    expect(actualUpsertedEvent.eventDate).toEqual("2015-02-03");
                    expect(actualUpsertedEvent.localStatus).toEqual("NEW_INCOMPLETE_DRAFT");
                    expect(actualUpsertedEvent.dataValues).toEqual([{
                        "dataElement": 'de1',
                        "value": '2015-02-03'
                    }, {
                        "dataElement": 'de2',
                        "value": undefined
                    }, {
                        "dataElement": 'de3',
                        "value": '2015-04-16'
                    }, {
                        "dataElement": 'de4',
                        "value": undefined
                    }, {
                        "dataElement": 'de5',
                        "value": undefined
                    }, {
                        "dataElement": 'de6',
                        "value": undefined
                    }]);
                });
            });

            describe('update', function () {
                beforeEach(function () {
                    initializeController();
                });

                it("should update event details", function() {
                    scope.orgUnitAssociatedToEvent = originOrgUnits[0];
                    scope.dataValues = {
                        'de1': "2015-04-15",
                        'de2': "someValue",
                        'de3': moment.utc('2015-04-16').toDate(),
                        'de4': "blah-again"
                    };

                    scope.update();
                    scope.$apply();

                    var expectedEventPayload = {
                        'event': "event1",
                        'orgUnit': "o1",
                        'eventDate': "2015-04-15",
                        'dataValues': [{
                            "dataElement": "de1",
                            "value": "2015-04-15"
                        }, {
                            "dataElement": "de2",
                            "value": "someValue"
                        }, {
                            "dataElement": "de3",
                            "value": "2015-04-16"
                        }, {
                            "dataElement": "de4",
                            "value": "blah-again"
                        }, {
                            "dataElement": "de5",
                            "value": undefined
                        }, {
                            "dataElement": "de6",
                            "value": undefined
                        }],
                        'localStatus': "UPDATED_DRAFT"
                    };

                    expect(programEventRepository.upsert).toHaveBeenCalledWith(expectedEventPayload);
                });
            });

            it('should set isEventDateSubstitute to true for the corresponding data element', function () {
                var mockDataElement = {
                    id: 'someDataElementId'
                };
                spyOn(customAttributes, 'getBooleanAttributeValue').and.returnValue(true);

                initializeController();

                expect(scope.isEventDateSubstitute(mockDataElement)).toEqual(true);
            });
        });
    });