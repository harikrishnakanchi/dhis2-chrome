define(["deleteEventConsumer", "angularMocks", "properties", "utils", "eventService"],
    function(DeleteEventConsumer, mocks, properties, utils, EventService) {
        describe("delete event data consumer", function() {
            var eventService, uploadEventDataConsumer;
            beforeEach(mocks.inject(function($q, $rootScope) {
                q = $q;
                scope = $rootScope.$new();

                eventService = new EventService();
                deleteEventConsumer = new DeleteEventConsumer(eventService, q);
            }));

            it("should delete event on DHIS", function() {
                var eventId = "event1234";

                var message = {
                    "data": {
                        "type": "deleteEvent",
                        "data": eventId
                    }
                };

                spyOn(eventService, "deleteEvent").and.returnValue(utils.getPromise(q, []));
                deleteEventConsumer.run(message);
                scope.$apply();

                expect(eventService.deleteEvent).toHaveBeenCalledWith(eventId);
            });
        });
    });