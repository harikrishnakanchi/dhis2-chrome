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

        it("should get all events from the start date", function() {
            var expectedEvents = {
                "events": [{
                    "event": "Event1",
                    "eventDate": "2014-10-06 00:00:00.0",
                }, {
                    "event": "Event2",
                    "eventDate": "2014-11-17 00:00:00.0",
                }]
            };

            var orgUnitId = "ou1";
            var endDate = moment().format("YYYY-MM-DD");
            var startDate = '2014-09-25';
            httpBackend.expectGET(properties.dhis.url + "/api/events?children=true&endDate=" + endDate + "&orgUnit=ou1&paging=false&startDate=" + startDate).respond(200, expectedEvents);

            eventService.getRecentEvents(startDate, orgUnitId).then(function(response) {
                expect(response).toEqual(expectedEvents);
            });

            httpBackend.flush();
        });

        it("should save events", function() {
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
