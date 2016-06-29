define(["eventService", "angularMocks", "properties", "moment", "lodash"], function(EventService, mocks, properties, moment, _) {
    describe("eventService", function() {
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
                    '&pageSize=200' +
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

            it('should not make more than the configured number of recursive requests', function() {
                var mockResponse = { pager: { pageCount: 99 }, events: ['mockEvent'] },
                    numberOfRequests = 0;

                httpBackend.whenGET(/.*/).respond(function () {
                    numberOfRequests++;
                    return [200, mockResponse];
                });

                eventService.getEvents(orgUnitId, periodRange);
                httpBackend.flush();

                expect(numberOfRequests).toEqual(50);
            });

            it('should not make any further requests if events response is empty', function() {
                var mockResponse = { pager: { pageCount: 99 }, events: [] };

                httpBackend.expectGET(/.*&page=1.*/).respond(200, mockResponse);

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
                    '&pageSize=1000' +
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

            it('should not make more than the configured number of recursive requests', function() {
                var mockResponse = { pager: { pageCount: 99 }, events: ['mockEvent'] },
                    numberOfRequests = 0;

                httpBackend.whenGET(/.*/).respond(function () {
                    numberOfRequests++;
                    return [200, mockResponse];
                });

                eventService.getEventIds(orgUnitId, periodRange);
                httpBackend.flush();

                expect(numberOfRequests).toEqual(10);
            });

            it('should not make any further requests if events response is empty', function() {
                var mockResponse = { pager: { pageCount: 99 }, events: [] };

                httpBackend.expectGET(/.*&page=1.*/).respond(200, mockResponse);

                eventService.getEventIds(orgUnitId, periodRange);
                httpBackend.flush();
            });
        });

        it("should save events", function() {
            var eventsPayload = {
                "events": [{
                    "event": "Event1",
                    "eventDate": "2001-01-01",
                    "period": "2001W01",
                    "localStatus": "NEW",
                    "eventCode": "C1"
                }]
            };

            var expectedPayload = {
                "events": [{
                    "event": "Event1",
                    "eventDate": "2001-01-01"
                }]
            };


            eventService.upsertEvents(eventsPayload);

            httpBackend.expectPOST(properties.dhis.url + "/api/events", expectedPayload).respond(200, "ok");

            httpBackend.flush();
        });

        it("should return rejected promise if save events fails", function() {
            var eventsPayload = {
                "events": [{
                    "event": "Event1",
                    "eventDate": "2001-01-01",
                    "period": "2001W01",
                    "localStatus": "NEW"
                }]
            };

            var expectedPayload = {
                "events": [{
                    "event": "Event1",
                    "eventDate": "2001-01-01"
                }]
            };
            var status;

            httpBackend.expectPOST(properties.dhis.url + "/api/events", expectedPayload).respond(500, "error");

            eventService.upsertEvents(eventsPayload).then(undefined, function(data) {
                status = data.status;
            });

            httpBackend.flush();
            expect(status).toEqual(500);
        });

        it("should delete event", function() {
            var eventId = "event1234";

            eventService.deleteEvent(eventId);

            httpBackend.expectDELETE(properties.dhis.url + "/api/events/" + eventId).respond(200, "OK");

            httpBackend.flush();
        });
    });
});
