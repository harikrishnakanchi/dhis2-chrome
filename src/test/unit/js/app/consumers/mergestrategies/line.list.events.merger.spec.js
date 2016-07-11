define(['lineListEventsMerger', 'angularMocks', 'moment'], function (LineListEventsMerger, mocks, moment) {
    describe('LineListEventsMerger', function () {
        var lineListEventsMerger,
            merger, updatedEventsFromDhis, eventIdsFromDhis, praxisEvents, someMomentInTime, someOlderMomentInTime;

        beforeEach(function () {
            praxisEvents = undefined;
            updatedEventsFromDhis = undefined;
            eventIdsFromDhis = undefined;
            someMomentInTime = moment('2016-06-12T12:00:00.000Z');
            someOlderMomentInTime = moment('2016-05-12T12:00:00.000Z');
            lineListEventsMerger = new LineListEventsMerger();
        });

        var createMerger = function () {
            return lineListEventsMerger.create(praxisEvents, updatedEventsFromDhis, eventIdsFromDhis);
        };

        var createMockEvent = function (options) {
            return _.merge({
                event: 'someEventId',
                lastUpdated: '2015-12-14T12:00:00.888+0000'
            }, options);
        };

        describe('updated events exist on DHIS', function () {
            beforeEach(function () {
                updatedEventsFromDhis = [createMockEvent({ lastUpdated: someMomentInTime })];
                eventIdsFromDhis = _.pluck(updatedEventsFromDhis, 'event');
                praxisEvents = [createMockEvent({ lastUpdated: someOlderMomentInTime })];
                merger = createMerger();
            });

            it('should return the updated DHIS events', function () {
                expect(merger.eventsToUpsert).toEqual(updatedEventsFromDhis);
            });

            it('should indicate that dhisIsUpToDateAndPraxisIsOutOfDate', function () {
                expect(merger.praxisAndDhisAreBothUpToDate).toEqual(false);
                expect(merger.dhisIsUpToDateAndPraxisIsOutOfDate).toEqual(true);
                expect(merger.praxisAndDhisAreBothOutOfDate).toEqual(false);
            });
        });

        describe('event in Praxis has no timestamps', function () {
            beforeEach(function () {
                updatedEventsFromDhis = [createMockEvent({ lastUpdated: someMomentInTime })];
                eventIdsFromDhis = _.pluck(updatedEventsFromDhis, 'event');
                praxisEvents = [createMockEvent({ lastUpdated: null })];
                merger = createMerger();
            });

            it('should return the updated DHIS event', function () {
                expect(merger.eventsToUpsert).toEqual(updatedEventsFromDhis);
            });
        });

        describe('submitted events exist on Praxis', function () {
            beforeEach(function () {
                praxisEvents = [createMockEvent({ clientLastUpdated: someMomentInTime, localStatus: 'READY_FOR_DHIS' })];
                merger = createMerger();
            });

            it('should return an empty array', function () {
                expect(merger.eventsToUpsert).toEqual([]);
            });

            it('should not indicate that praxisAndDhisAreBothUpToDate', function () {
                expect(merger.praxisAndDhisAreBothUpToDate).toEqual(false);
            });

            it('should not indicate that dhisIsUpToDateAndPraxisIsOutOfDate', function () {
                expect(merger.dhisIsUpToDateAndPraxisIsOutOfDate).toEqual(false);
            });

            it('should not indicate that praxisAndDhisAreBothOutOfDate', function () {
                expect(merger.praxisAndDhisAreBothOutOfDate).toEqual(false);
            });
        });

        describe('deleted events exist on Praxis', function () {
            beforeEach(function () {
                praxisEvents = [createMockEvent({ localStatus: 'DELETED' })];
                merger = createMerger();
            });

            it('should return an empty array', function () {
                expect(merger.eventsToUpsert).toEqual([]);
            });

            it('should not indicate that praxisAndDhisAreBothUpToDate', function () {
                expect(merger.praxisAndDhisAreBothUpToDate).toEqual(false);
            });

            it('should not indicate that dhisIsUpToDateAndPraxisIsOutOfDate', function () {
                expect(merger.dhisIsUpToDateAndPraxisIsOutOfDate).toEqual(false);
            });

            it('should not indicate that praxisAndDhisAreBothOutOfDate', function () {
                expect(merger.praxisAndDhisAreBothOutOfDate).toEqual(false);
            });
        });

        describe('deleted event exists on Praxis but was also updated on DHIS', function () {
            var dhisEvent;

            beforeEach(function () {
                dhisEvent = createMockEvent({ event: 'eventA', lastUpdated: someMomentInTime });
                updatedEventsFromDhis = [dhisEvent];
                eventIdsFromDhis = _.pluck(updatedEventsFromDhis, 'event');
                praxisEvents = [createMockEvent({ event: 'eventA', lastUpdated: someOlderMomentInTime, localStatus: 'DELETED' })];
                merger = createMerger();
            });

            it('should return the updated DHIS event', function () {
                expect(merger.eventsToUpsert).toEqual([dhisEvent]);
            });
        });

        describe('updated events exist on DHIS and submitted events exist on Praxis', function () {
            var dhisEventA, dhisEventB, praxisEventA, praxisEventB;

            beforeEach(function () {
                dhisEventA = createMockEvent({ event: 'eventIdA', lastUpdated: someMomentInTime });
                dhisEventB = createMockEvent({ event: 'eventIdB', lastUpdated: someOlderMomentInTime });
                praxisEventA = createMockEvent({ event: 'eventIdA', clientLastUpdated: someOlderMomentInTime, localStatus: 'READY_FOR_DHIS' });
                praxisEventB = createMockEvent({ event: 'eventIdB', clientLastUpdated: someMomentInTime, localStatus: 'READY_FOR_DHIS' });

                updatedEventsFromDhis = [dhisEventA, dhisEventB];
                eventIdsFromDhis = _.pluck(updatedEventsFromDhis, 'event');
                praxisEvents = [praxisEventA, praxisEventB];

                merger = createMerger();
            });

            it('should return the DHIS events that are more recent than the Praxis events', function () {
                expect(merger.eventsToUpsert).toEqual([dhisEventA]);
            });

            it('should indicate that praxisAndDhisAreBothOutOfDate', function () {
                expect(merger.praxisAndDhisAreBothUpToDate).toEqual(false);
                expect(merger.dhisIsUpToDateAndPraxisIsOutOfDate).toEqual(false);
                expect(merger.praxisAndDhisAreBothOutOfDate).toEqual(true);
            });
        });

        describe('updated and submitted events do not exist on DHIS and Praxis respectively', function () {
            beforeEach(function () {
                var mockEvent = createMockEvent({ lastUpdated: someMomentInTime });
                praxisEvents = [mockEvent];
                updatedEventsFromDhis = [mockEvent];
                eventIdsFromDhis = _.pluck(updatedEventsFromDhis, 'event');
                merger = createMerger();
            });

            it('should return an empty array', function () {
                expect(merger.eventsToUpsert).toEqual([]);
            });

            it('should indicate that praxisAndDhisAreBothUpToDate', function () {
                expect(merger.praxisAndDhisAreBothUpToDate).toEqual(true);
                expect(merger.dhisIsUpToDateAndPraxisIsOutOfDate).toEqual(false);
                expect(merger.praxisAndDhisAreBothOutOfDate).toEqual(false);
            });
        });

        describe('events were deleted on DHIS', function () {
            var eventThatWasDeletedOnDhis, anotherEvent, eventModifiedOnPraxis;

            beforeEach(function () {
                eventThatWasDeletedOnDhis = createMockEvent({ event: 'deletedEventId' });
                anotherEvent = createMockEvent({ event: 'anotherEventId' });
                eventModifiedOnPraxis = createMockEvent({ event: 'newEventId', localStatus: 'SOME_STATUS_THAT_WE_WILL_NOT_SPEAK_OF' });
            });

            it('should return the Praxis event ids that need to be deleted', function () {
                eventIdsFromDhis = [anotherEvent.event];
                praxisEvents = [eventThatWasDeletedOnDhis, anotherEvent];
                merger = createMerger();

                expect(merger.eventIdsToDelete).toEqual([eventThatWasDeletedOnDhis.event]);
            });

            it('should not return events that have been modified on Praxis', function () {
                eventIdsFromDhis = [anotherEvent.event];
                praxisEvents = [eventModifiedOnPraxis, anotherEvent];
                merger = createMerger();

                expect(merger.eventIdsToDelete).toEqual([]);
            });

            it('should indicate that dhisIsUpToDateAndPraxisIsOutOfDate', function () {
                eventIdsFromDhis = [anotherEvent.event];
                praxisEvents = [eventThatWasDeletedOnDhis, anotherEvent];

                merger = createMerger();

                expect(merger.praxisAndDhisAreBothUpToDate).toEqual(false);
                expect(merger.dhisIsUpToDateAndPraxisIsOutOfDate).toEqual(true);
                expect(merger.praxisAndDhisAreBothOutOfDate).toEqual(false);
            });
        });
    });
});