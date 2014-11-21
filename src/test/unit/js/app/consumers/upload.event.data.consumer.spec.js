define(["uploadEventDataConsumer", "angularMocks", "properties", "utils", "eventService", "programEventRepository"],
    function(UploadEventDataConsumer, mocks, properties, utils, EventService, ProgramEventRepository) {
        describe("upload event data consumer", function() {

            var eventService, uploadEventDataConsumer, programEventRepository;

            beforeEach(mocks.inject(function($q, $rootScope) {
                q = $q;
                scope = $rootScope.$new();

                eventService = new EventService();
                programEventRepository = new ProgramEventRepository();
                uploadEventDataConsumer = new UploadEventDataConsumer(eventService, programEventRepository, q);
            }));

            it("should save event data to DHIS", function() {
                var eventPayload = {
                    'events': [{
                        'event': 'e1',
                        'eventDate': '2014-09-28'
                    }]
                };

                var message = {
                    "data": {
                        "type": "uploadEventData",
                        "data": eventPayload
                    }
                };

                spyOn(programEventRepository, "upsert");
                spyOn(eventService, "upsertEvents").and.returnValue(utils.getPromise(q, []));
                uploadEventDataConsumer.run(message);
                scope.$apply();

                expect(eventService.upsertEvents).toHaveBeenCalledWith(eventPayload);
            });

            it("should change event localStatus in indexedDb", function() {
                var eventPayload = {
                    'events': [{
                        'event': 'e1',
                        'eventDate': '2014-09-28',
                        'localStatus': "NEW"
                    }]
                };

                var message = {
                    "data": {
                        "type": "uploadEventData",
                        "data": eventPayload
                    }
                };

                var expectedPayload = {
                    'events': [{
                        'event': 'e1',
                        'eventDate': '2014-09-28'
                    }]
                };

                spyOn(programEventRepository, "upsert");
                spyOn(eventService, "upsertEvents").and.returnValue(utils.getPromise(q, eventPayload));
                uploadEventDataConsumer.run(message);
                scope.$apply();

                expect(programEventRepository.upsert).toHaveBeenCalledWith(expectedPayload);
            });


        });
    });