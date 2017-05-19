define(["eventReportsRepository", "utils", "angularMocks"], function (EventReportsRepository, utils, mocks) {
    describe('Event Repository', function () {
        var mockDB, mockStore, eventReportsRepository, q;

        beforeEach(mocks.inject(function ($q) {
            q = $q;
            mockDB = utils.getMockDB(q);
            mockStore = mockDB.objectStore;

            eventReportsRepository = new EventReportsRepository(q, mockDB.db);
        }));

        it('should get all events', function () {
            var allEvents = [{
                id: 'someEventId'
            }, {
                id: 'someOtherEventId'
            }];
            mockStore.getAll.and.returnValue(utils.getPromise(q, allEvents));

            eventReportsRepository.getAll().then(function (events) {
                expect(events).toEqual(allEvents);
            });
            expect(mockStore.getAll).toHaveBeenCalled();
        });

        it('should upsert the event reports', function () {
            var eventReports = ['someEventReport'];
            eventReportsRepository.upsert(eventReports);
            expect(mockStore.upsert).toHaveBeenCalledWith(eventReports);
        });

        it('should delete the given event reports', function () {
            var eventReportIds = ['someReportId', 'someOtherReportId'];
            eventReportsRepository.deleteEventReportsById(eventReportIds);
            expect(mockStore.delete).toHaveBeenCalledWith('someReportId');
            expect(mockStore.delete).toHaveBeenCalledWith('someOtherReportId');
        });
    });
});