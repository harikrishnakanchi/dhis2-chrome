define(["programEventRepository", "angularMocks", "utils"], function(ProgramEventRepository, mocks, utils) {
    describe("programEventRepository", function() {

        var scope, q, programEventRepository;

        beforeEach(mocks.inject(function($q, $rootScope) {
            q = $q;
            scope = $rootScope;

            var mockDB = utils.getMockDB($q);
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
    });
});