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
            programEventRepository = new ProgramEventRepository(mockDB.db);
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
            programEventRepository = new ProgramEventRepository(mockDB.db);

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
            programEventRepository = new ProgramEventRepository(mockDB.db);

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
            programEventRepository = new ProgramEventRepository(mockDB.db);
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

            programEventRepository = new ProgramEventRepository(mockDB.db);


            var actualEvents;
            programEventRepository.getEventsFromPeriod('2014W40').then(function(events) {
                actualEvents = events;
            });

            scope.$apply();

            expect(mockStore.each.calls.argsFor(0)[0].betweenX).toEqual("2014W40");
            expect(mockStore.each.calls.argsFor(0)[0].betweenY).toEqual(moment().year() + "W" + moment().week());

            expect(actualEvents).toEqual(listOfEvents);
        });

        it("should get events for particular period and orgUnit", function(){
            mockDB = utils.getMockDB(q);
            mockStore = mockDB.objectStore;
            programEventRepository = new ProgramEventRepository(mockDB.db);
            
            programEventRepository.getEventsForPeriodAndOrgUnit("2014W01", "mod1");
            scope.$apply();

            expect(mockStore.each.calls.argsFor(0)[0].eq).toEqual([ '2014W01', 'mod1' ] );
        });
    });
});