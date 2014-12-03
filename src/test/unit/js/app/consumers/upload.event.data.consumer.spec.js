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

            it("should save event data to DHIS and change local status in indexedDb", function() {
                var events = [{
                    'event': 'e1',
                    'eventDate': '2014-09-28',
                    'localStatus': "NEW"
                }, {
                    'event': 'e2',
                    'eventDate': '2014-09-29'
                }];

                spyOn(programEventRepository, "getLastUpdatedPeriod").and.returnValue(utils.getPromise(q, "2014W44"));
                spyOn(programEventRepository, "getEventsFromPeriod").and.returnValue(utils.getPromise(q, events));

                var dhisEventPayload = {
                    'events': [{
                        'event': 'e1',
                        'eventDate': '2014-09-28',
                        'localStatus': "NEW"
                    }]
                };
                spyOn(eventService, "upsertEvents").and.returnValue(utils.getPromise(q, dhisEventPayload));
                spyOn(programEventRepository, "upsert");

                uploadEventDataConsumer.run();
                scope.$apply();


                expect(eventService.upsertEvents).toHaveBeenCalledWith(dhisEventPayload);

                var dbEventPayload = {
                    'events': [{
                        'event': 'e1',
                        'eventDate': '2014-09-28'
                    }]
                };
                expect(programEventRepository.upsert).toHaveBeenCalledWith(dbEventPayload);

            });

        });
    });