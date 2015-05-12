define(["lineListDataEntryController", "angularMocks", "utils", "moment", "timecop", "programEventRepository"],
    function(LineListDataEntryController, mocks, utils, moment, timecop, ProgramEventRepository) {
        describe("lineListDataEntryController ", function() {

            var scope, q, programRepository, db, mockStore, allEvents, optionSets, originOrgUnits;

            beforeEach(module('hustle'));
            beforeEach(mocks.inject(function($rootScope, $q) {
                scope = $rootScope.$new();
                q = $q;

                optionSets = [{
                    'id': 'os1',
                    'options': [{
                        'id': 'os1o1',
                        'name': 'os1o1 name'
                    }]
                }, {
                    'id': 'os2',
                    'options': [{
                        'id': 'os2o1',
                        'name': 'os2o1 name'
                    }]
                }];

                db = {
                    "objectStore": jasmine.createSpy("objectStore").and.callFake(function(storeName) {
                        return utils.getMockStore(q, [], optionSets);
                    })
                };

                scope.resourceBundle = {};
                scope.week = {
                    "weekNumber": 44,
                    "weekYear": 2014,
                    "startOfWeek": "2014-10-27",
                    "endOfWeek": "2014-11-02"
                };

                scope.currentModule = {
                    'id': 'currentModuleId',
                    'parent': {
                        'id': 'par1'
                    }
                };

                originOrgUnits = [{
                    "id": "o1",
                    "name": "o1"
                }, {
                    "id": "o2",
                    "name": "o2"
                }];

                scope.originOrgUnits = originOrgUnits;
                scope.showResultMessage = jasmine.createSpy("showResultMessage");
                scope.originOrgUnitsById = {
                    "o1": originOrgUnits[0],
                    "o2": originOrgUnits[1]
                };

                programEventRepository = new ProgramEventRepository();
                spyOn(programEventRepository, "upsert").and.returnValue(utils.getPromise(q, []));

                Timecop.install();
                Timecop.freeze(new Date("2014-10-29T12:43:54.972Z"));
            }));

            afterEach(function() {
                Timecop.returnToPresent();
                Timecop.uninstall();
            });

            it("should load optionSetMapping and dataValues on init", function() {
                scope.program = {
                    'programStages': [{
                        'programStageSections': [{
                            'programStageDataElements': [{
                                "dataElement": {
                                    "id": "de1"
                                }
                            }, {
                                "dataElement": {
                                    "id": "de2"
                                }
                            }, {
                                "dataElement": {
                                    "id": "de3"
                                }
                            }, {
                                "dataElement": {
                                    "id": "de4",
                                    "optionSet": {
                                        "id": "os1"
                                    }
                                }
                            }]
                        }]
                    }]
                };

                scope.event = {
                    "event": "a41bd7adefc",
                    "dataValues": [{
                        "name": "Case Number - Measles Outbreak",
                        "type": "string",
                        "value": "66",
                        "dataElement": "de1"
                    }, {
                        "name": "Date of admission - Measles Outbreak",
                        "type": "date",
                        "value": "2015-04-15",
                        "dataElement": "de2"
                    }, {
                        "name": "Age at visit - Measles Outbreak",
                        "type": "int",
                        "value": 3,
                        "dataElement": "de3"
                    }, {
                        "name": "Sex - Measles Outbreak",
                        "type": "string",
                        "value": "os1o1",
                        "dataElement": "de4"
                    }]
                };

                scope.resourceBundle = {
                    'os2o1': 'os2o1 translated name'
                };
                var lineListDataEntryController = new LineListDataEntryController(scope, db, programEventRepository);
                scope.$apply();

                expect(scope.optionSets).toEqual(optionSets);
                expect(scope.optionSetMapping).toEqual({
                    "os1": [{
                        "id": 'os1o1',
                        "name": 'os1o1 name',
                        "displayName": 'os1o1 name',
                    }],
                    "os2": [{
                        "id": 'os2o1',
                        "name": 'os2o1 name',
                        "displayName": 'os2o1 translated name'
                    }]
                });
                expect(scope.dataValues).toEqual({
                    'de1': '66',
                    'de2': new Date("2015-04-15".replace(/-/g, ',')),
                    'de3': 3,
                    'de4': {
                        'id': 'os1o1',
                        'name': 'os1o1 name',
                        'displayName': 'os1o1 name'
                    }
                });
            });

            it("should set min and max date for selected period", function() {

                scope.week = {
                    "weekNumber": 46,
                    "weekYear": 2014,
                    "startOfWeek": "2014-11-10",
                    "endOfWeek": "2014-11-16"
                };

                var lineListDataEntryController = new LineListDataEntryController(scope, db, programEventRepository);
                scope.$apply();

                expect(moment(scope.minDateInCurrentPeriod).format("YYYY-MM-DD")).toEqual("2014-11-10");
                expect(moment(scope.maxDateInCurrentPeriod).format("YYYY-MM-DD")).toEqual("2014-11-16");
            });

            it("should save event details as newDraft and show summary view", function() {
                var program = {
                    'id': 'Prg1',
                };

                var programStage = {
                    'id': 'PrgStage1',
                    'programStageSections': [{
                        'id': 'section1',
                        'programStageDataElements': [{
                            "dataElement": {
                                "id": "de1",
                                'attributeValues': [{
                                    'attribute': {
                                        'code': 'useAsEventDate'
                                    },
                                    'value': 'true'
                                }]
                            }
                        }, {
                            "dataElement": {
                                "id": "de2"
                            }
                        }]
                    }, {
                        'id': 'section2',
                        'programStageDataElements': [{
                            "dataElement": {
                                "id": "de3"
                            }
                        }]
                    }]
                };


                spyOn(location, "hash");

                scope.program = program;
                scope.loadEventsView = jasmine.createSpy("loadEventsView");
                scope.resourceBundle = {
                    'eventSaveSuccess': 'Event saved successfully'
                };
                scope.programId = "p2";

                var lineListDataEntryController = new LineListDataEntryController(scope, db, programEventRepository);
                scope.$apply();

                scope.dataValues = {
                    'de1': "2015-02-03",
                    'de2': "someValue",
                    'de3': "blah"
                };

                scope.patientOrigin = {
                    "selected": originOrgUnits[0]
                };
                scope.save(programStage);
                scope.$apply();

                var actualPayloadInUpsertCall = programEventRepository.upsert.calls.first().args[0];

                expect(actualPayloadInUpsertCall.events[0].program).toEqual("Prg1");
                expect(actualPayloadInUpsertCall.events[0].programStage).toEqual("PrgStage1");
                expect(actualPayloadInUpsertCall.events[0].orgUnit).toEqual("o1");
                expect(actualPayloadInUpsertCall.events[0].eventDate).toEqual("2015-02-03");
                expect(actualPayloadInUpsertCall.events[0].localStatus).toEqual("NEW_DRAFT");
                expect(actualPayloadInUpsertCall.events[0].dataValues).toEqual([{
                    "dataElement": 'de1',
                    "value": '2015-02-03'
                }, {
                    "dataElement": 'de2',
                    "value": 'someValue'
                }, {
                    "dataElement": 'de3',
                    "value": 'blah'
                }]);

                expect(scope.loadEventsView).toHaveBeenCalled();
            });

            it("should save event details as newDraft and show data entry form again", function() {
                scope.program = {
                    'id': 'Prg1',
                };

                scope.loadEventsView = jasmine.createSpy("loadEventsView");

                var programStage = {
                    'id': 'PrgStage1',
                };

                var lineListDataEntryController = new LineListDataEntryController(scope, db, programEventRepository);
                scope.$apply();

                scope.patientOrigin = {
                    "selected": originOrgUnits[0]
                };
                scope.eventDates = {
                    "Prg1": {
                        "PrgStage1": "2014-11-18T10:34:14.067Z"
                    }
                };

                scope.save(programStage, true);
                scope.$apply();

                expect(scope.loadEventsView).not.toHaveBeenCalled();
            });

            it("should update event details", function() {
                var programStage = {
                    'id': 'PrgStage1',
                    'programStageSections': [{
                        'id': 'section1',
                        'programStageDataElements': [{
                            "dataElement": {
                                "id": "de1",
                                'attributeValues': [{
                                    'attribute': {
                                        'code': 'useAsEventDate'
                                    },
                                    'value': 'true'
                                }]
                            }
                        }, {
                            "dataElement": {
                                "id": "de2"
                            }
                        }]
                    }, {
                        'id': 'section2',
                        'programStageDataElements': [{
                            "dataElement": {
                                "id": "de3"
                            }
                        }]
                    }]
                };

                spyOn(location, "hash");

                scope.resourceBundle = {
                    'eventSaveSuccess': 'Event updated successfully'
                };

                scope.event = {
                    "event": "event1",
                    "program": "Prg1",
                    "programStage": "PrgStage1",
                    "orgUnit": "Mod1",
                    "eventDate": "2014-12-29",
                    "dataValues": [{
                        "dataElement": "de1",
                        "value": "2014-12-31",
                        "type": "date"
                    }, {
                        "dataElement": "de2",
                        "value": "13",
                        "type": "int"
                    }, {
                        "dataElement": "de3",
                        "value": "14",
                        "type": "int"
                    }]
                };

                var lineListDataEntryController = new LineListDataEntryController(scope, db, programEventRepository);
                scope.$apply();

                scope.patientOrigin = {
                    "selected": originOrgUnits[0]
                };
                scope.update(programStage);
                scope.$apply();

                var eventPayload = {
                    "events": [{
                        'event': "event1",
                        'program': "Prg1",
                        'programStage': "PrgStage1",
                        'orgUnit': "o1",
                        'eventDate': new Date("2014,12,31"),
                        'dataValues': [{
                            "dataElement": "de1",
                            "value": new Date("2014,12,31")
                        }, {
                            "dataElement": "de2",
                            "value": 13
                        }, {
                            "dataElement": "de3",
                            "value": 14
                        }],
                        'localStatus': "UPDATED_DRAFT"
                    }]
                };

                expect(programEventRepository.upsert).toHaveBeenCalledWith(eventPayload);
            });

            it("should save incomplete events", function() {
                var program = {
                    'id': 'Prg1',
                };

                var programStage = {
                    'id': 'PrgStage1',
                    'programStageSections': [{
                        'id': 'section1',
                        'programStageDataElements': [{
                            "compulsory": true,
                            "dataElement": {
                                "id": "de1",
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
                                "id": "de2"
                            }
                        }]
                    }, {
                        'id': 'section2',
                        'programStageDataElements': [{
                            "dataElement": {
                                "id": "de3"
                            }
                        }]
                    }]
                };


                spyOn(location, "hash");

                scope.program = program;
                scope.loadEventsView = jasmine.createSpy("loadEventsView");
                scope.resourceBundle = {
                    'eventSaveSuccess': 'Event saved successfully'
                };
                scope.programId = "p2";

                var lineListDataEntryController = new LineListDataEntryController(scope, db, programEventRepository);
                scope.$apply();

                scope.dataValues = {
                    'de1': "2015-02-03",
                    'de2': undefined,
                    'de3': "blah"
                };

                scope.patientOrigin = {
                    "selected": originOrgUnits[0]
                };
                scope.save(programStage);
                scope.$apply();

                var actualPayloadInUpsertCall = programEventRepository.upsert.calls.first().args[0];

                expect(actualPayloadInUpsertCall.events[0].program).toEqual("Prg1");
                expect(actualPayloadInUpsertCall.events[0].programStage).toEqual("PrgStage1");
                expect(actualPayloadInUpsertCall.events[0].orgUnit).toEqual("o1");
                expect(actualPayloadInUpsertCall.events[0].eventDate).toEqual("2015-02-03");
                expect(actualPayloadInUpsertCall.events[0].localStatus).toEqual("NEW_INCOMPLETE_DRAFT");
                expect(actualPayloadInUpsertCall.events[0].dataValues).toEqual([{
                    "dataElement": 'de1',
                    "value": '2015-02-03'
                }, {
                    "dataElement": 'de2',
                    "value": undefined
                }, {
                    "dataElement": 'de3',
                    "value": 'blah'
                }]);
            });
        });
    });
