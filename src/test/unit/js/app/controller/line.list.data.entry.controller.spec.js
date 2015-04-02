define(["lineListDataEntryController", "angularMocks", "utils", "moment", "timecop", "programEventRepository"],
    function(LineListDataEntryController, mocks, utils, moment, timecop, ProgramEventRepository) {
        describe("lineListDataEntryController ", function() {

            var scope, q, programRepository, db, mockStore, allEvents, optionSets, originOrgUnits;

            beforeEach(module('hustle'));
            beforeEach(mocks.inject(function($rootScope, $q) {
                scope = $rootScope.$new();
                q = $q;

                optionSets = [{
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

            it("should find optionSets for id", function() {
                var lineListDataEntryController = new LineListDataEntryController(scope, db, programEventRepository);
                scope.$apply();

                expect(scope.getOptionsFor('os2')).toEqual([{
                    'id': 'os2o1',
                    'name': 'os2o1 name',
                    'displayName': 'os2o1 name'
                }]);
            });

            it("should translate options", function() {
                scope.resourceBundle = {
                    'os2o1': 'os2o1 translated name'
                };

                var lineListDataEntryController = new LineListDataEntryController(scope, db, programEventRepository);
                scope.$apply();

                expect(scope.getOptionsFor('os2')).toEqual([{
                    'id': 'os2o1',
                    'name': 'os2o1 name',
                    'displayName': 'os2o1 translated name'
                }]);
            });

            it("should get eventDates with default set to today", function() {
                var eventDates = {};

                var lineListDataEntryController = new LineListDataEntryController(scope, db, programEventRepository);
                scope.$apply();

                scope.getEventDateNgModel(eventDates, 'p1', 'ps1');

                expect(moment(eventDates.p1.ps1).isSame(scope.minDateInCurrentPeriod, 'days')).toBe(true);
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
                    'programStageDataElements': []
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

                scope.eventDates = {
                    "Prg1": {
                        "PrgStage1": "2014-11-18T10:34:14.067Z"
                    }
                };

                scope.dataValues = {};

                scope.patientOrigin = {
                    "selected": originOrgUnits[0]
                };
                scope.save(programStage);
                scope.$apply();

                var actualPayloadInUpsertCall = programEventRepository.upsert.calls.first().args[0];

                expect(actualPayloadInUpsertCall.events[0].program).toEqual("Prg1");
                expect(actualPayloadInUpsertCall.events[0].programStage).toEqual("PrgStage1");
                expect(actualPayloadInUpsertCall.events[0].orgUnit).toEqual("o1");
                expect(actualPayloadInUpsertCall.events[0].eventDate).toEqual("2014-11-18");
                expect(actualPayloadInUpsertCall.events[0].localStatus).toEqual("NEW_DRAFT");
                expect(actualPayloadInUpsertCall.events[0].dataValues).toEqual([]);

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
                                "id": "de1"
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
                    "eventDate": "2014-12-29T05:06:30.950+0000",
                    "dataValues": [{
                        "dataElement": "de1",
                        "value": "12",
                        "type": "int"
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
                        'eventDate': "2014-12-29",
                        'dataValues': [{
                            "dataElement": "de1",
                            "value": 12
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
        });
    });
