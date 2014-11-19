define(["programEventRepository", "angularMocks", "utils"], function(ProgramEventRepository, mocks, utils) {
    describe("programEventRepository", function() {

        var scope, q, programEventRepository, mockDB;

        beforeEach(mocks.inject(function($q, $rootScope) {
            q = $q;
            scope = $rootScope;

            mockDB = utils.getMockDB($q);
            mockStore = mockDB.objectStore;
            programEventRepository = new ProgramEventRepository(mockDB.db);
        }));

        it("should add period and upsert event payload", function() {
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
                expect(data).toEqual({'events': expectedEventData});
            });
            scope.$apply();

            expect(mockStore.upsert).toHaveBeenCalledWith(expectedEventData);
        });

        it("should delete an event given an id", function(){
            programEventRepository.delete("eventId");
            scope.$apply();

            expect(mockStore.delete).toHaveBeenCalledWith("eventId");
        }); 

        it("should get events", function(){
            programEventRepository.getEvents();
            scope.$apply();

            expect(mockStore.getAll).toHaveBeenCalled();
        });
    });
});