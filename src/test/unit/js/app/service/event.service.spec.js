define(['eventService', 'angularMocks', 'properties', 'moment', 'lodash'], function(EventService, mocks, properties, moment, _) {
    describe('eventService', function() {
        var httpBackend, http, eventService;

        beforeEach(mocks.inject(function($injector, $q) {
            q = $q;
            httpBackend = $injector.get('$httpBackend');
            http = $injector.get('$http');

            eventService = new EventService(http, q);
        }));

        afterEach(function() {
            httpBackend.verifyNoOutstandingExpectation();
            httpBackend.verifyNoOutstandingRequest();
        });

        describe('getEvents', function() {
            var orgUnitId, periodRange;

            beforeEach(function() {
                orgUnitId = 'someOrgUnitId';
                periodRange = ['2016W18', '2016W19'];
            });

            it('should download events for the specified orgUnit and period range', function () {
                var expectedEndDate = moment(_.last(periodRange), 'GGGG[W]WW').endOf('isoWeek').format('YYYY-MM-DD'),
                    expectedStartDate = moment(_.first(periodRange), 'GGGG[W]WW').startOf('isoWeek').format('YYYY-MM-DD');

                httpBackend.expectGET(properties.dhis.url + '/api/events' +
                    '?endDate=' + expectedEndDate +
                    '&fields=:all,dataValues%5Bvalue,dataElement,providedElsewhere,storedBy%5D' +
                    '&orgUnit=' + orgUnitId +
                    '&ouMode=DESCENDANTS' +
                    '&page=1' +
                    '&pageSize=' + properties.eventsSync.pageSize.eventData +
                    '&startDate=' + expectedStartDate +
                    '&totalPages=true'
                ).respond(200, {});

                eventService.getEvents(orgUnitId, periodRange);
                httpBackend.flush();
            });

            it('should download events that have been updated after specified timestamp', function () {
                var lastUpdated = 'someMomentInTime';
                httpBackend.expectGET(new RegExp('.*lastUpdated=' + lastUpdated + '.*')).respond(200, {});

                eventService.getEvents(orgUnitId, periodRange, lastUpdated);
                httpBackend.flush();
            });

            it('should return events from the response', function() {
                var mockDhisResponse = {
                        events: ['mockEventA', 'mockEventB']
                    };

                httpBackend.expectGET(/.*/).respond(200, mockDhisResponse);

                eventService.getEvents(orgUnitId, periodRange).then(function(response) {
                    expect(response).toEqual(mockDhisResponse.events);
                });

                httpBackend.flush();
            });

            it('should format the eventDate as an ISO8601 date', function () {
                var mockDHISResponse = {
                    events: [{
                        id: 'someId',
                        eventDate: '2016-09-09T00:00:00+0000'
                    }]
                };

                httpBackend.expectGET(/.*/).respond(200, mockDHISResponse);
                eventService.getEvents(orgUnitId, periodRange).then(function (response) {
                    var event = _.first(response);
                    expect(event.eventDate).toEqual('2016-09-09');
                });

                httpBackend.flush();
            });

            it('should return an empty array if response is empty', function() {
                httpBackend.expectGET(/.*/).respond(200, {});

                eventService.getEvents('someOrgUnitId', ['2016W25']).then(function(response) {
                    expect(response).toEqual([]);
                });

                httpBackend.flush();
            });

            it('should download each page of results', function() {
                var mockResponses = {
                    page1: {
                        events: [
                            { event: 'eventIdA' }
                        ],
                        pager: {
                            pageCount: 2
                        }
                    },
                    page2: {
                        events: [
                            { event: 'eventIdB' }
                        ],
                        pager: {
                            pageCount: 2
                        }
                    }
                };
                httpBackend.expectGET(/.*&page=1.*/).respond(200, mockResponses.page1);
                httpBackend.expectGET(/.*&page=2.*/).respond(200, mockResponses.page2);

                eventService.getEvents(orgUnitId, periodRange);
                httpBackend.flush();
            });
        });

        describe('getEventIds', function() {
            var orgUnitId, periodRange;

            beforeEach(function() {
                orgUnitId = 'someOrgUnitId';
                periodRange = ['2016W18', '2016W19'];
            });

            it('should download the event ids for specified orgUnit and period range', function() {
                var expectedEndDate = moment(_.last(periodRange), 'GGGG[W]WW').endOf('isoWeek').format('YYYY-MM-DD'),
                    expectedStartDate = moment(_.first(periodRange), 'GGGG[W]WW').startOf('isoWeek').format('YYYY-MM-DD');

                httpBackend.expectGET(properties.dhis.url + '/api/events' +
                    '?endDate=' + expectedEndDate +
                    '&fields=event' +
                    '&orgUnit=' + orgUnitId +
                    '&ouMode=DESCENDANTS' +
                    '&page=1' +
                    '&pageSize=' + properties.eventsSync.pageSize.eventIds +
                    '&startDate=' + expectedStartDate +
                    '&totalPages=true'
                ).respond(200, {});

                eventService.getEventIds(orgUnitId, periodRange);
                httpBackend.flush();
            });

            it('should return the event ids from the response', function() {
                var mockResponse = {
                    events: [
                        { event: 'eventIdA' },
                        { event: 'eventIdB' }
                    ]
                };
                httpBackend.expectGET(/.*/).respond(200, mockResponse);

                eventService.getEventIds(orgUnitId, periodRange).then(function (response) {
                    expect(response).toEqual(_.pluck(mockResponse.events, 'event'));
                });

                httpBackend.flush();
            });

            it('should return an empty array if response is empty', function() {
                httpBackend.expectGET(/.*/).respond(200, {});

                eventService.getEventIds(orgUnitId, periodRange).then(function(response) {
                    expect(response).toEqual([]);
                });

                httpBackend.flush();
            });

            it('should download each page of results', function() {
                var mockResponses = {
                    page1: {
                        events: [
                            { event: 'eventIdA' }
                        ],
                        pager: {
                            pageCount: 2
                        }
                    },
                    page2: {
                        events: [
                            { event: 'eventIdB' }
                        ],
                        pager: {
                            pageCount: 2
                        }
                    }
                };
                httpBackend.expectGET(/.*&page=1.*/).respond(200, mockResponses.page1);
                httpBackend.expectGET(/.*&page=2.*/).respond(200, mockResponses.page2);

                eventService.getEventIds(orgUnitId, periodRange);
                httpBackend.flush();
            });
        });

        describe('createEvents', function () {
            it("should create the events to DHIS", function() {
                var events = [{
                    event: 'someEventId'
                }];
                httpBackend.expectPOST(properties.dhis.url + '/api/events', { events: events }).respond(200, {});

                eventService.createEvents(events);
                httpBackend.flush();
            });

            it('should remove the praxis specific properties from the event before uploading', function () {
                var event = {
                    event: 'someEventId',
                    period: 'somePeriod',
                    localStatus: 'someStatus',
                    clientLastUpdated: 'someTime',
                    eventCode: 'someCode'
                }, expectedPayLoad = {
                    events: [
                        _.omit(event, ['period', 'localStatus', 'clientLastUpdated', 'eventCode'])
                    ]
                };

                httpBackend.expectPOST(properties.dhis.url + '/api/events', expectedPayLoad).respond(200, {});

                eventService.createEvents([event]);
                httpBackend.flush();
            });
        });

        describe('updateEvents', function() {
            it('should update the events on DHIS', function() {
                var eventA = { event: 'eventAId' },
                    eventB = { event: 'eventBId' };

                httpBackend.expectPUT(properties.dhis.url + '/api/events/' + eventA.event, eventA).respond(200, {});
                httpBackend.expectPUT(properties.dhis.url + '/api/events/' + eventB.event, eventB).respond(200, {});

                eventService.updateEvents([eventA, eventB]);
                httpBackend.flush();
            });
        });

        it("should delete event", function() {
            var eventId = "event1234";

            eventService.deleteEvent(eventId);

            httpBackend.expectDELETE(properties.dhis.url + "/api/events/" + eventId).respond(200, "OK");

            httpBackend.flush();
        });
    });
});
