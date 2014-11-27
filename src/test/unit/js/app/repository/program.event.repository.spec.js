define(["programEventRepository", "angularMocks", "utils", "moment"], function(ProgramEventRepository, mocks, utils, moment) {
    describe("programEventRepository", function() {

        var scope, q, programEventRepository, mockDB;

        beforeEach(mocks.inject(function($q, $rootScope) {
            q = $q;
            scope = $rootScope;
        }));

        it("should add period and upsert event payload", function() {
            mockDB = utils.getMockDB(q);
            mockStore = mockDB.objectStore;
            programEventRepository = new ProgramEventRepository(mockDB.db, q);
            var eventData = {
                'events': [{
                    'event': 'e1',
                    'eventDate': '2010-11-07'
                }]
            };

            var expectedEventData = [{
                'event': 'e1',
                'eventDate': '2010-11-07',
                'period': '2010W44'
            }];

            programEventRepository.upsert(eventData).then(function(data) {
                expect(data).toEqual({
                    'events': expectedEventData
                });
            });
            scope.$apply();

            expect(mockStore.upsert).toHaveBeenCalledWith(expectedEventData);
        });

        it("should delete an event given an id", function() {
            mockDB = utils.getMockDB(q);
            mockStore = mockDB.objectStore;
            programEventRepository = new ProgramEventRepository(mockDB.db, q);

            programEventRepository.delete("eventId");
            scope.$apply();

            expect(mockStore.delete).toHaveBeenCalledWith("eventId");
        });

        it("should get last updated period if data is present in indexedDB", function() {
            var allEvents = [{
                'event': 'event_1',
                'period': '2014W44'
            }, {
                'event': 'event_2',
                'period': '2014W47'
            }];

            mockDB = utils.getMockDB(q, [], allEvents);
            mockStore = mockDB.objectStore;
            programEventRepository = new ProgramEventRepository(mockDB.db, q);

            var lastUpdatedPeriod;
            programEventRepository.getLastUpdatedPeriod().then(function(data) {
                lastUpdatedPeriod = data;
            });
            scope.$apply();

            expect(mockStore.getAll).toHaveBeenCalled();
            expect(lastUpdatedPeriod).toEqual('2014W47');
        });

        it("should get last updated period if no data is present in indexedDB", function() {
            mockDB = utils.getMockDB(q);
            mockStore = mockDB.objectStore;
            programEventRepository = new ProgramEventRepository(mockDB.db, q);
            var lastUpdatedPeriod;

            programEventRepository.getLastUpdatedPeriod().then(function(data) {
                lastUpdatedPeriod = data;
            });
            scope.$apply();

            expect(mockStore.getAll).toHaveBeenCalled();
            expect(lastUpdatedPeriod).toEqual('1900W01');
        });

        it("should get all events from given period", function() {
            var listOfEvents = [{
                'id': 'e1'
            }];

            mockDB = utils.getMockDB(q, [], [], listOfEvents);
            mockStore = mockDB.objectStore;

            programEventRepository = new ProgramEventRepository(mockDB.db, q);


            var actualEvents;
            programEventRepository.getEventsFromPeriod('2014W40').then(function(events) {
                actualEvents = events;
            });

            scope.$apply();

            expect(mockStore.each.calls.argsFor(0)[0].betweenX).toEqual("2014W40");
            expect(mockStore.each.calls.argsFor(0)[0].betweenY).toEqual(moment().year() + "W" + moment().week());

            expect(actualEvents).toEqual(listOfEvents);
        });

        it("should get events for particular period and orgUnit", function() {

            var program = {
                'id': 'p1',
                'programStages': [{
                    'id': 'p1s1'
                }]
            };

            var programStage = {
                'id': 'p1s1',
                'programStageSections': [{
                    'id': 'st1',
                    'programStageDataElements': [{
                        'dataElement': {
                            'id': 'de1'
                        }
                    }, {
                        'dataElement': {
                            'id': 'de2'
                        }
                    }]
                }]
            };

            var dataElements = [{
                'id': 'de1',
                'shortName': 'Age',
                "attributeValues": [{
                    "attribute": {
                        "code": "showInEventSummary",
                    },
                    "value": "true"
                }]
            }, {
                'id': 'de2',
                'shortName': 'PatientId',
            }, {
                'id': 'de3',
                'shortName': 'SomeNonProgramDataElement',
            }];

            var events = [{
                'event': 'event1',
                'eventDate': '2014-11-26T00:00:00',
                'dataValues': [{
                    'dataElement': 'de1',
                    'value': '20'
                }]
            }, {
                'event': 'event2',
                'eventDate': '2014-11-24T00:00:00',
                'dataValues': [{
                    'dataElement': 'de2',
                    'value': 'ABC1'
                }]
            }];

            mockDB = utils.getMockDB(q, "", dataElements);
            mockStore = mockDB.objectStore;

            mockStore.find.and.callFake(function(id) {
                if (id === "p1")
                    return utils.getPromise(q, program);
                if (id === "p1s1")
                    return utils.getPromise(q, programStage);
                if (id === "de1")
                    return utils.getPromise(q, dataElements[0]);
                if (id === "de2")
                    return utils.getPromise(q, dataElements[1]);
                return utils.getPromise(q, undefined);
            });

            mockStore.each.and.returnValue(utils.getPromise(q, events));

            programEventRepository = new ProgramEventRepository(mockDB.db, q);

            var enrichedEvents;
            programEventRepository.getEventsFor("p1", "2014W01", "mod1").then(function(data) {
                enrichedEvents = data;
            });
            scope.$apply();

            var expectedEvents = [{
                event: 'event1',
                eventDate: '2014-11-26T00:00:00',
                dataValues: [{
                    shortName: 'Age',
                    showInEventSummary: true,
                    dataElement: 'de1',
                    value: '20',
                }, {
                    shortName: 'PatientId',
                    showInEventSummary: false,
                    dataElement: 'de2'
                }]
            }, {
                event: 'event2',
                eventDate: '2014-11-24T00:00:00',
                dataValues: [{
                    shortName: 'Age',
                    showInEventSummary: true,
                    dataElement: 'de1'
                }, {
                    shortName: 'PatientId',
                    showInEventSummary: false,
                    dataElement: 'de2',
                    value: 'ABC1',
                }]
            }];

            expect(enrichedEvents).toEqual(expectedEvents);
        });
    });
});