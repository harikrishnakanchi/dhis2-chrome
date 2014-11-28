define(["deleteEventConsumer", "angularMocks", "properties", "utils", "eventService", "programEventRepository"],
    function(DeleteEventConsumer, mocks, properties, utils, EventService, ProgramEventRepository) {
        describe("delete event consumer", function() {
            var eventService, uploadEventDataConsumer, programEventRepository;

            beforeEach(mocks.inject(function($q, $rootScope) {
                q = $q;
                scope = $rootScope.$new();

                eventService = new EventService();
                programEventRepository = new ProgramEventRepository();

                deleteEventConsumer = new DeleteEventConsumer(eventService, programEventRepository, q);
            }));

            it("should delete event on DHIS and then from indexeddb", function() {
                var eventId = "event1234";

                var message = {
                    "data": {
                        "type": "deleteEvent",
                        "data": eventId
                    }
                };

                spyOn(eventService, "deleteEvent").and.returnValue(utils.getPromise(q, []));
                spyOn(programEventRepository, "delete").and.returnValue(utils.getPromise(q, []));

                deleteEventConsumer.run(message);
                scope.$apply();

                expect(eventService.deleteEvent).toHaveBeenCalledWith(eventId);
                expect(programEventRepository.delete).toHaveBeenCalledWith(eventId);
            });

            it("should not delete event from indexeddb if deletion from DHIS fails", function() {
                var eventId = "event1234";

                var message = {
                    "data": {
                        "type": "deleteEvent",
                        "data": eventId
                    }
                };

                spyOn(eventService, "deleteEvent").and.returnValue(utils.getRejectedPromise(q, []));
                spyOn(programEventRepository, "delete");

                deleteEventConsumer.run(message);
                scope.$apply();

                expect(eventService.deleteEvent).toHaveBeenCalledWith(eventId);
                expect(programEventRepository.delete).not.toHaveBeenCalled();
            });
        });
    });