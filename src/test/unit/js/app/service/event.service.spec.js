define(["eventService", "angularMocks", "properties", "moment"], function(EventService, mocks, properties, moment) {
    describe("eventService", function() {
        var httpBackend, http, eventService;

        beforeEach(mocks.inject(function($injector, $q) {
            q = $q;
            httpBackend = $injector.get('$httpBackend');
            http = $injector.get('$http');

            eventService = new EventService(http);
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

            var endDate = moment().format("YYYY-MM-DD");
            var startDate = '2014-09-25';
            httpBackend.expectGET(properties.dhis.url + "/api/events?endDate=" + endDate + "&startDate=" + startDate).respond(200, expectedEvents);

            eventService.getRecentEvents(startDate).then(function(response) {
                expect(response).toEqual(expectedEvents);
            });

            httpBackend.flush();
        });



    });
});