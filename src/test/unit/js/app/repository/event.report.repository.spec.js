define(["eventReportRepository", "utils", "angularMocks"], function (EventReportRepository, utils, mocks) {
    describe('Event Repository', function () {
        var mockDB, mockStore, eventReportRepository, q;

        beforeEach(mocks.inject(function ($q) {
            q = $q;
            mockDB = utils.getMockDB(q);
            mockStore = mockDB.objectStore;

            eventReportRepository = new EventReportRepository(q, mockDB.db);
        }));

        it('should get all events', function () {
            var allEvents = [{
                id: 'someEventId'
            }, {
                id: 'someOtherEventId'
            }];
            mockStore.getAll.and.returnValue(utils.getPromise(q, allEvents));

            eventReportRepository.getAll().then(function (events) {
                expect(events).toEqual(allEvents);
            });
            expect(mockStore.getAll).toHaveBeenCalled();
        });

        it('should upsert the event reports', function () {
            var eventReports = ['someEventReport'];
            eventReportRepository.upsert(eventReports);
            expect(mockStore.upsert).toHaveBeenCalledWith(eventReports);
        });

        it('should delete the given event reports', function () {
            var eventReportIds = ['someReportId', 'someOtherReportId'];
            eventReportRepository.deleteEventReportsById(eventReportIds);
            expect(mockStore.delete).toHaveBeenCalledWith('someReportId');
            expect(mockStore.delete).toHaveBeenCalledWith('someOtherReportId');
        });
    });
});