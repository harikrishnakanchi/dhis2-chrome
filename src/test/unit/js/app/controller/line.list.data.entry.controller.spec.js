define(["lineListDataEntryController", "angularMocks", "utils", "moment", "timecop", "programEventRepository", "optionSetRepository", "orgUnitRepository", "excludedDataElementsRepository", "programRepository", "translationsService", "historyService"],
    function(LineListDataEntryController, mocks, utils, moment, timecop, ProgramEventRepository, OptionSetRepository, OrgUnitRepository, ExcludedDataElementsRepository, ProgramRepository, TranslationsService, HistoryService) {
        describe("lineListDataEntryController ", function() {

            var scope, lineListDataEntryController, q, routeparams, location, programEventRepository, mockStore, allEvents, optionSets, originOrgUnits, optionSetRepository, optionSetMapping, orgUnitRepository, excludedDataElementsRepository, programRepository, anchorScroll, translationsService, historyService;

            beforeEach(module('hustle'));
            beforeEach(mocks.inject(function($rootScope, $q, $location, $anchorScroll) {
                scope = $rootScope.$new();
                rootScope = $rootScope;
                anchorScroll = $anchorScroll;
                q = $q;
                location = $location;

                scope.resourceBundle = {};

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

                spyOn(location, "hash");

                programEventRepository = new ProgramEventRepository();
                spyOn(programEventRepository, "upsert").and.returnValue(utils.getPromise(q, []));
                spyOn(programEventRepository, "findEventById").and.returnValue(utils.getPromise(q, [ev]));

                var optionSetMapping = {
                    "optionSetMap": {}
                };

                optionSetRepository = new OptionSetRepository();
                spyOn(optionSetRepository, "getOptionSetMapping").and.returnValue(utils.getPromise(q, optionSetMapping));

                historyService = new HistoryService(location);
                spyOn(historyService, "back");

                var module = {
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
                spyOn(orgUnitRepository, "get").and.returnValue(utils.getPromise(q, module));
                spyOn(orgUnitRepository, "findAllByParent").and.returnValue(utils.getPromise(q, originOrgUnits));
                spyOn(orgUnitRepository, "getParentProject").and.returnValue(utils.getPromise(q, {}));

                excludedDataElementsRepository = new ExcludedDataElementsRepository();
                spyOn(excludedDataElementsRepository, "get").and.returnValue(utils.getPromise(q, {}));

                var program = {
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
                            }]
                        }]
                    }]
                };

                programRepository = new ProgramRepository();
                spyOn(programRepository, "getProgramForOrgUnit").and.returnValue(utils.getPromise(q, program));
                spyOn(programRepository, "get").and.returnValue(utils.getPromise(q, program));

                translationsService = new TranslationsService();
                spyOn(translationsService, "translate").and.returnValue(program);
                spyOn(translationsService, "translateOptionSetMap").and.returnValue(optionSetMapping.optionSetMap);

                Timecop.install();
                Timecop.freeze(new Date("2014-10-29T12:43:54.972Z"));

                lineListDataEntryController = new LineListDataEntryController(scope, rootScope, routeParams, location, anchorScroll, historyService, programEventRepository, optionSetRepository, orgUnitRepository, excludedDataElementsRepository, programRepository, translationsService);
                scope.$apply();
            }));

            afterEach(function() {
                Timecop.returnToPresent();
                Timecop.uninstall();
            });

            it("should set scope variables on init", function() {
                expect(scope.selectedModuleId).toBeDefined();
                expect(scope.selectedModuleName).toBeDefined();
                expect(scope.originOrgUnits).toBeDefined();
                expect(scope.program).toBeDefined();
                expect(scope.optionSetMapping).toBeDefined();
            });

            it("should load dataValues on init", function() {

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


                var optionSetMapping = {
                    "optionSetMap": {
                        "os1": [{
                            "id": 'os1o1',
                            "code": 'os1o1',
                            "name": 'os1o1 name',
                            "displayName": 'os1o1 name',
                        }],
                        "os2": [{
                            "id": 'os2o1',
                            "code": 'os2o1',
                            "name": 'os2o1 name',
                            "displayName": 'os2o1 translated name'
                        }]
                    }
                };
                optionSetRepository.getOptionSetMapping.and.returnValue(utils.getPromise(q, optionSetMapping));
                translationsService.translateOptionSetMap.and.returnValue(optionSetMapping.optionSetMap);

                var lineListDataEntryController = new LineListDataEntryController(scope, rootScope, routeParams, location, anchorScroll, historyService, programEventRepository, optionSetRepository, orgUnitRepository, excludedDataElementsRepository, programRepository, translationsService);
                scope.$apply();

                expect(scope.dataValues).toEqual({
                    'de1': '66',
                    'de2': "2015-04-15",
                    'de3': 3,
                    'de4': {
                        'id': 'os1o1',
                        'code': 'os1o1',
                        'name': 'os1o1 name',
                        'displayName': 'os1o1 name'
                    }
                });
            });

            it("should save event details as newDraft and show summary view", function() {
                scope.dataValues = {
                    'de1': "2015-02-03",
                    'de2': "someValue",
                    'de3': moment.utc('2015-02-04').toDate(),
                    'de4': {
                        'id': 'os1o1',
                        'code': 'os1o1',
                        'name': 'os1o1 name',
                        'displayName': 'os1o1 name'
                    },
                    'de5': moment('2015-02-05 20:00:00').toDate()
                };

                scope.patientOrigin = {
                    "selected": originOrgUnits[0]
                };

                scope.save();
                scope.$apply();

                var actualUpsertedEvent = programEventRepository.upsert.calls.first().args[0];

                expect(actualUpsertedEvent.program).toEqual("Prg1");
                expect(actualUpsertedEvent.programStage).toEqual("PrgStage1");
                expect(actualUpsertedEvent.orgUnit).toEqual(originOrgUnits[0].id);
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
                }]);
                expect(historyService.back).toHaveBeenCalledWith({
                    "messageType": "success",
                    "message": scope.resourceBundle.eventSaveSuccess
                });
            });

            it("should save event details as newDraft and show data entry form again", function() {
                scope.patientOrigin = {
                    "selected": originOrgUnits[0]
                };
                scope.eventDates = {
                    "Prg1": {
                        "PrgStage1": "2014-11-18T10:34:14.067Z"
                    }
                };

                scope.save(true);

                expect(historyService.back).not.toHaveBeenCalled();
                expect(location.hash).toHaveBeenCalled();

                scope.$apply();
            });

            it("should update event details", function() {
                scope.patientOrigin = {
                    "selected": originOrgUnits[0]
                };

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
                    }],
                    'localStatus': "UPDATED_DRAFT"
                };

                expect(programEventRepository.upsert).toHaveBeenCalledWith(expectedEventPayload);
            });

            it("should save incomplete events", function() {
                scope.dataValues = {
                    'de1': "2015-02-03",
                    'de2': undefined,
                    'de3': moment.utc('2015-04-16').toDate(),
                    'de4': undefined
                };
                scope.patientOrigin = {
                    "selected": originOrgUnits[0]
                };
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
                }]);
            });
        });
    });