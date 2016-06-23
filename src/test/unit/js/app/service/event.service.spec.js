define(["eventService", "angularMocks", "properties", "moment"], function(EventService, mocks, properties, moment) {
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
            it('should get events for the specified orgUnit and period range', function() {
                var orgUnitId = 'someOrgUnitId',
                    periodRange = ['2016W18', '2016W19'],
                    expectedEndDate = moment(_.last(periodRange), 'GGGG[W]WW').endOf('isoWeek').format('YYYY-MM-DD'),
                    expectedStartDate = moment(_.first(periodRange), 'GGGG[W]WW').startOf('isoWeek').format('YYYY-MM-DD'),
                    mockDhisResponse = {
                        events: ['mockEventA', 'mockEventB']
                    };

                httpBackend.expectGET(properties.dhis.url + '/api/events' +
                    '?endDate=' + expectedEndDate +
                    '&fields=:all,dataValues%5Bvalue,dataElement,providedElsewhere,storedBy%5D' +
                    '&orgUnit=' + orgUnitId +
                    '&ouMode=DESCENDANTS' +
                    '&skipPaging=true' +
                    '&startDate=' + expectedStartDate
                ).respond(200, mockDhisResponse);

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
