define(["eventReportRepository", "utils", "angularMocks", "eventReport"], function (EventReportRepository, utils, mocks, EventReport) {
    describe('Event Repository', function () {
        var mockDB, mockStore, eventReportRepository, q, scope;

        beforeEach(mocks.inject(function ($q, $rootScope) {
            q = $q;
            mockDB = utils.getMockDB(q);
            mockStore = mockDB.objectStore;
            scope = $rootScope.$new();

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
                expect(events).toEqual([jasmine.any(EventReport), jasmine.any(EventReport)]);
            });

            scope.$apply();

            expect(mockStore.getAll).toHaveBeenCalled();
        });

        it('should upsert the event reports', function () {
            var eventReports = ['someEventReport'];
            eventReportRepository.upsert(eventReports);
            expect(mockStore.upsert).toHaveBeenCalledWith(eventReports);
        });

        it('should upsert the event report data', function () {
            var data = {id: 'eventReportId'};
            eventReportRepository.upsertEventReportData('someEventReport', 'someOrgUnit', data);

            expect(mockStore.upsert).toHaveBeenCalledWith({
                eventReport: 'someEventReport',
                orgUnit: 'someOrgUnit',
                data: data
            });
        });

        it('should delete the given event reports', function () {
            var eventReportIds = ['someReportId', 'someOtherReportId'];
            eventReportRepository.deleteEventReportsById(eventReportIds);
            expect(mockStore.delete).toHaveBeenCalledWith('someReportId');
            expect(mockStore.delete).toHaveBeenCalledWith('someOtherReportId');
        });
    });
});