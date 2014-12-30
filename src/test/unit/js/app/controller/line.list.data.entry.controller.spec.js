define(["lineListDataEntryController", "angularMocks", "utils", "moment", "programRepository", "programEventRepository", "dataElementRepository"],
    function(LineListDataEntryController, mocks, utils, moment, ProgramRepository, ProgramEventRepository, DataElementRepository) {
        describe("lineListDataEntryController ", function() {

            var scope, q, hustle, programRepository, mockDB, mockStore, dataElementRepository, allEvents, timeout,
                fakeModal, anchorScroll, location, event1, event2, event3, event4;

            beforeEach(module('hustle'));
            beforeEach(mocks.inject(function($rootScope, $q, $hustle, $timeout, $location) {
                scope = $rootScope.$new();
                q = $q;
                hustle = $hustle;
                timeout = $timeout;
                location = $location;
                anchorScroll = jasmine.createSpy();

                fakeModal = {
                    close: function() {
                        this.result.confirmCallBack();
                    },
                    dismiss: function(type) {
                        this.result.cancelCallback(type);
                    },
                    open: function(object) {}
                };

                mockDB = utils.getMockDB($q);
                mockStore = mockDB.objectStore;

                scope.resourceBundle = {};
                scope.week = {
                    "weekNumber": 44,
                    "weekYear": 2014,
                    "startOfWeek": "2014-10-27",
                    "endOfWeek": "2014-11-02"
                };
                scope.currentModule = {
                    'id': 'ae2a77b82a5'
                };

                event1 = {
                    event: 'event1',
                    eventDate: '2014-12-29T05:06:30.950+0000',
                    dataValues: [{
                        dataElement: 'de1',
                        value: 'a11',
                        showInEventSummary: true,
                        name: 'dataElement1',
                    }]
                };

                event2 = {
                    event: 'event2',
                    eventDate: '2014-12-29T05:06:30.950+0000',
                    dataValues: [{
                        dataElement: 'de2',
                        value: 'b22',
                        showInEventSummary: false,
                        name: 'dataElement2',
                    }]
                };

                programRepository = new ProgramRepository();
                programEventRepository = new ProgramEventRepository();
                dataElementRepository = new DataElementRepository();

                programEventRepository = {
                    "getAll": jasmine.createSpy("getAll").and.returnValue(utils.getPromise(q, [event1, event2])),
                    "getEventsFor": jasmine.createSpy("getEventsFor").and.returnValue(utils.getPromise(q, [])),
                    "upsert": jasmine.createSpy("upsert").and.returnValue(utils.getPromise(q, [])),
                    "delete": jasmine.createSpy("delete").and.returnValue(utils.getPromise(q, {})),
                    "markEventsAsSubmitted": jasmine.createSpy("delete").and.returnValue(utils.getPromise(q, {}))
                };

                programEventRepository.getEventsFor.and.callFake(function(programId) {
                    if (programId === "p1")
                        return utils.getPromise(q, [event1]);
                    if (programId === "p2")
                        return utils.getPromise(q, [event2]);
                    return utils.getPromise(q, undefined);
                });
            }));

            it("should load programs into scope on init", function() {
                var programAndStageData = {
                    'id': 'p1'
                };
                spyOn(programRepository, "getProgramAndStages").and.returnValue(utils.getPromise(q, programAndStageData));

                scope.programsInCurrentModule = ['p1'];
                var lineListDataEntryController = new LineListDataEntryController(scope, q, hustle, fakeModal, timeout, location, anchorScroll, mockDB.db, programRepository, programEventRepository, dataElementRepository);
                scope.$apply();

                expect(programRepository.getProgramAndStages).toHaveBeenCalledWith('p1');
                expect(scope.programs).toEqual([programAndStageData]);
            });

            it("should load all optionSets to scope on init", function() {
                var optionSets = [{
                    'id': 'os1'
                }];
                mockStore.getAll.and.returnValue(utils.getPromise(q, optionSets));

                var lineListDataEntryController = new LineListDataEntryController(scope, q, hustle, fakeModal, timeout, location, anchorScroll, mockDB.db, programRepository, programEventRepository, dataElementRepository);
                scope.$apply();

                expect(scope.optionSets).toBe(optionSets);
            });

            it("should find optionSets for id", function() {
                var optionSets = [{
                    'id': 'os1',
                    'options': [{
                        'id': 'os1o1'
                    }]
                }, {
                    'id': 'os2',
                    'options': [{
                        'id': 'os2o1',
                        'name': 'os2o1 name'
                    }]
                }];

                mockStore.getAll.and.returnValue(utils.getPromise(q, optionSets));

                var lineListDataEntryController = new LineListDataEntryController(scope, q, hustle, fakeModal, timeout, location, anchorScroll, mockDB.db, programRepository, programEventRepository, dataElementRepository);
                scope.$apply();

                expect(scope.getOptionsFor('os2')).toEqual([{
                    'id': 'os2o1',
                    'name': 'os2o1 name',
                    'displayName': 'os2o1 name'
                }]);
            });

            it("should translate options", function() {
                scope.resourceBundle = {
                    'os1o1': 'os1o1 translated name'
                };

                mockStore.getAll.and.returnValue(utils.getPromise(q, [{
                    'id': 'os1',
                    'options': [{
                        'id': 'os1o1',
                        'name': 'os1o1 name'
                    }]
                }]));

                var lineListDataEntryController = new LineListDataEntryController(scope, q, hustle, fakeModal, timeout, location, anchorScroll, mockDB.db, programRepository, programEventRepository, dataElementRepository);
                scope.$apply();

                expect(scope.getOptionsFor('os1')).toEqual([{
                    'id': 'os1o1',
                    'name': 'os1o1 name',
                    'displayName': 'os1o1 translated name'
                }]);
            });

            it("should update dataValues with new program and stage if not present", function() {
                var dataValues = {};

                var lineListDataEntryController = new LineListDataEntryController(scope, q, hustle, fakeModal, timeout, location, anchorScroll, mockDB.db, programRepository, programEventRepository, dataElementRepository);
                scope.$apply();

                scope.getDataValueNgModel(dataValues, 'p1', 'ps1');

                expect(dataValues).toEqual({
                    'p1': {
                        'ps1': {}
                    }
                });
            });

            it("should change dataValues", function() {
                var dataValues = {
                    'p1': {
                        'ps1': {}
                    }
                };

                var lineListDataEntryController = new LineListDataEntryController(scope, q, hustle, fakeModal, timeout, location, anchorScroll, mockDB.db, programRepository, programEventRepository, dataElementRepository);
                scope.$apply();

                scope.getDataValueNgModel(dataValues, 'p1', 'ps2');

                expect(dataValues).toEqual({
                    'p1': {
                        'ps1': {},
                        'ps2': {}
                    }
                });
            });

            it("should get eventDates with default set to today", function() {
                var eventDates = {};

                var lineListDataEntryController = new LineListDataEntryController(scope, q, hustle, fakeModal, timeout, location, anchorScroll, mockDB.db, programRepository, programEventRepository, dataElementRepository);
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

                var lineListDataEntryController = new LineListDataEntryController(scope, q, hustle, fakeModal, timeout, location, anchorScroll, mockDB.db, programRepository, programEventRepository, dataElementRepository);
                scope.$apply();

                expect(moment(scope.minDateInCurrentPeriod).format("YYYY-MM-DD")).toEqual("2014-11-10");
                expect(moment(scope.maxDateInCurrentPeriod).format("YYYY-MM-DD")).toEqual("2014-11-16");
            });

            it("should save event details as draft and show view", function() {
                var program = {
                    'id': 'Prg1',
                };

                var programStage = {
                    'id': 'PrgStage1',
                    'programStageDataElements': []
                };

                spyOn(location, "hash");

                scope.resourceBundle = {
                    'eventSaveSuccess': 'Event saved successfully'
                };
                scope.programsInCurrentModule = ["p1", "p2"];

                spyOn(programRepository, "getProgramAndStages").and.returnValue(utils.getPromise(q, []));
                var lineListDataEntryController = new LineListDataEntryController(scope, q, hustle, fakeModal, timeout, location, anchorScroll, mockDB.db, programRepository, programEventRepository, dataElementRepository);
                scope.$apply();

                scope.eventDates = {
                    "Prg1": {
                        "PrgStage1": "2014-11-18T10:34:14.067Z"
                    }
                };

                scope.dataValues = {
                    "Prg1": {
                        "PrgStage1": {}
                    }
                };

                scope.save(program, programStage);
                scope.$apply();

                var actualPayloadInUpsertCall = programEventRepository.upsert.calls.first().args[0];

                expect(actualPayloadInUpsertCall.events[0].program).toEqual("Prg1");
                expect(actualPayloadInUpsertCall.events[0].programStage).toEqual("PrgStage1");
                expect(actualPayloadInUpsertCall.events[0].orgUnit).toEqual("ae2a77b82a5");
                expect(actualPayloadInUpsertCall.events[0].eventDate).toEqual("2014-11-18");
                expect(actualPayloadInUpsertCall.events[0].localStatus).toEqual("DRAFT");
                expect(actualPayloadInUpsertCall.events[0].dataValues).toEqual([]);

                expect(scope.resultMessageType).toEqual("success");
                expect(scope.resultMessage).toEqual("Event saved successfully");
                expect(location.hash).toHaveBeenCalled();

                expect(programEventRepository.getEventsFor).toHaveBeenCalled();
                var expectedEvents = [event1, event2];
                expect(scope.allEvents).toEqual(expectedEvents);

                expect(scope.showView).toEqual(true);
                expect(scope.showForm).toEqual(false);

            });

            it("should save event details as draft and show form again", function() {
                var program = {
                    'id': 'Prg1',
                };

                var programStage = {
                    'id': 'PrgStage1',
                };

                var lineListDataEntryController = new LineListDataEntryController(scope, q, hustle, fakeModal, timeout, location, anchorScroll, mockDB.db, programRepository, programEventRepository, dataElementRepository);
                scope.$apply();

                scope.eventDates = {
                    "Prg1": {
                        "PrgStage1": "2014-11-18T10:34:14.067Z"
                    }
                };

                scope.save(program, programStage, true);
                scope.$apply();

                expect(scope.showView).toEqual(false);
                expect(scope.showForm).toEqual(true);

            });

            it("should submit event details", function() {
                spyOn(hustle, "publish").and.returnValue(utils.getPromise(q, ""));
                spyOn(location, "hash");

                scope.resourceBundle = {
                    'eventSubmitSuccess': 'Event submitted succesfully'
                };

                var lineListDataEntryController = new LineListDataEntryController(scope, q, hustle, fakeModal, timeout, location, anchorScroll, mockDB.db, programRepository, programEventRepository, dataElementRepository);
                scope.year = "2014";

                scope.submit("Prg1");
                scope.$apply();

                expect(programEventRepository.markEventsAsSubmitted).toHaveBeenCalledWith("Prg1", "2014W44", "ae2a77b82a5");
                expect(hustle.publish).toHaveBeenCalledWith({
                    type: 'uploadProgramEvents'
                }, 'dataValues');
                expect(scope.resultMessageType).toEqual("success");
                expect(scope.resultMessage).toEqual("Event submitted succesfully");
                expect(location.hash).toHaveBeenCalled();
            });

            it("should soft-delete event which is POSTed to DHIS", function() {
                scope.programsInCurrentModule = ["p1", "p2"];
                spyOn(programRepository, "getProgramAndStages").and.returnValue(utils.getPromise(q, []));
                spyOn(hustle, "publish").and.returnValue(utils.getPromise(q, ""));
                spyOn(fakeModal, "open").and.returnValue({
                    result: utils.getPromise(q, {})
                });

                var lineListDataEntryController = new LineListDataEntryController(scope, q, hustle, fakeModal, timeout, location, anchorScroll, mockDB.db, programRepository, programEventRepository, dataElementRepository);

                var eventToDelete = event1;
                scope.deleteEvent(eventToDelete);
                scope.$apply();

                var softDeletedEventPayload = {
                    "events": [eventToDelete]
                };

                expect(fakeModal.open).toHaveBeenCalled();
                expect(scope.allEvents).toEqual([event2]);
                expect(hustle.publish).toHaveBeenCalledWith({
                    data: 'event1',
                    type: 'deleteEvent'
                }, 'dataValues');
                expect(programEventRepository.upsert).toHaveBeenCalledWith(softDeletedEventPayload);
                expect(eventToDelete.localStatus).toEqual("DELETED");
            });

            it("should hard delete a local event", function() {
                event1.localStatus = "DRAFT";
                scope.programsInCurrentModule = ["p1", "p2"];
                spyOn(programRepository, "getProgramAndStages").and.returnValue(utils.getPromise(q, []));
                spyOn(hustle, "publish");
                spyOn(fakeModal, "open").and.returnValue({
                    result: utils.getPromise(q, {})
                });

                var lineListDataEntryController = new LineListDataEntryController(scope, q, hustle, fakeModal, timeout, location, anchorScroll, mockDB.db, programRepository, programEventRepository, dataElementRepository);

                var eventToDelete = event1;
                scope.deleteEvent(eventToDelete);
                scope.$apply();

                expect(fakeModal.open).toHaveBeenCalled();
                expect(scope.allEvents).toEqual([event2]);
                expect(programEventRepository.delete).toHaveBeenCalledWith('event1');
                expect(hustle.publish).not.toHaveBeenCalled();
            });

            it("should get data value", function() {
                var dataValue = {
                    "id": "dv1",
                    "value": "Case123"
                };

                var lineListDataEntryController = new LineListDataEntryController(scope, q, hustle, fakeModal, timeout, location, anchorScroll, mockDB.db, programRepository, programEventRepository, dataElementRepository);
                var actualValue = scope.getDisplayValue(dataValue);
                scope.$apply();

                expect(actualValue).toEqual("Case123");
            });

            it("should get option names as data value if options are present", function() {
                var dataValue = {
                    "id": "dv1",
                    "optionSet": {
                        "options": [{
                            "id": "Code1",
                            "code": "Code1",
                            "name": "Male"
                        }, {
                            "id": "Code2",
                            "code": "Code2",
                            "name": "Female"
                        }]
                    },
                    "value": "Code1"
                };

                var lineListDataEntryController = new LineListDataEntryController(scope, q, hustle, fakeModal, timeout, location, anchorScroll, mockDB.db, programRepository, programEventRepository, dataElementRepository);
                var actualValue = scope.getDisplayValue(dataValue);
                scope.$apply();

                expect(actualValue).toEqual("Male");
            });

            it("should get all event and set correct event to be edited if route params has id", function() {
                var optionSets = [{
                    'id': 'os1'
                }];
                var program = {
                    "id": "ab1cbd4f11a",
                    "name": "Surgery - V1",
                    "programStages": [{
                        "id": "a40aa8ce8d5",
                        "name": "Surgery - V1 Stage",
                        "programStageSections": [{
                            "id": "W2SSCuf7fv8",
                            "name": "Surgery",
                            "programStageDataElements": [{
                                "dataElement": {
                                    "id": "de1",
                                    "name": "Patient ID - V1 - Surgery",
                                    "type": "string"
                                }
                            }, {
                                "dataElement": {
                                    "id": "de2",
                                    "name": "Type of patient - V1 - Surgery",
                                    "type": "string"
                                }

                            }]
                        }]
                    }]
                };

                var expectedEvent = {
                    "event": 'event1',
                    "program": {
                        "id": "ab1cbd4f11a",
                        "name": "Surgery - V1",
                        "programStages": [{
                            "id": "a40aa8ce8d5",
                            "name": "Surgery - V1 Stage",
                            "programStageSections": [{
                                "id": "W2SSCuf7fv8",
                                "name": "Surgery",
                                "programStageDataElements": [{
                                    "dataElement": {
                                        "id": "de1",
                                        "name": "Patient ID - V1 - Surgery",
                                        "type": "string"
                                    }
                                }, {
                                    "dataElement": {
                                        "id": "de2",
                                        "name": "Type of patient - V1 - Surgery",
                                        "type": "string"
                                    }

                                }]
                            }]
                        }]
                    },
                    "dataValues": [{
                        "dataElement": 'de1',
                        "value": 'a11',
                        "showInEventSummary": true,
                        "name": 'dataElement1',
                    }],
                    "dataElementValues": {
                        "de1": 'a11'
                    }
                };

                mockStore.getAll.and.returnValue(utils.getPromise(q, optionSets));
                spyOn(programRepository, "getProgramAndStages").and.returnValue(utils.getPromise(q, program));
                var lineListDataEntryController = new LineListDataEntryController(scope, q, hustle, fakeModal, timeout, location, anchorScroll, mockDB.db, programRepository, programEventRepository, dataElementRepository);
                
                scope.setUpViewOrEditForm('event1');
                scope.$apply();

                expect(programEventRepository.getAll).toHaveBeenCalled();
                expect(scope.eventToBeEdited).toEqual(event1);
            });
        });
    });