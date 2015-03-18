define(["uploadEventDataConsumer", "angularMocks", "properties", "utils", "eventService", "programEventRepository", "userPreferenceRepository"],
    function(UploadEventDataConsumer, mocks, properties, utils, EventService, ProgramEventRepository, UserPreferenceRepository) {
        describe("upload event data consumer", function() {

            var eventService, uploadEventDataConsumer, programEventRepository, userPreferenceRepository;

            beforeEach(mocks.inject(function($q, $rootScope) {
                q = $q;
                scope = $rootScope.$new();

                userPreferenceRepository = new UserPreferenceRepository();
                spyOn(userPreferenceRepository, "getUserModuleIds").and.returnValue(utils.getPromise(q, ["prj1"]));
                eventService = new EventService();
                programEventRepository = new ProgramEventRepository();
                uploadEventDataConsumer = new UploadEventDataConsumer(eventService, programEventRepository, userPreferenceRepository, q);
            }));

            it("should save event data to DHIS and change local status in indexedDb", function() {
                var events = [{
                    'event': 'e1',
                    'eventDate': '2014-09-28',
                    'localStatus': "READY_FOR_DHIS"
                }, {
                    'event': 'e2',
                    'eventDate': '2014-09-29'
                }];

                spyOn(programEventRepository, "isDataPresent").and.returnValue(utils.getPromise(q, true));
                spyOn(programEventRepository, "getEventsFromPeriod").and.returnValue(utils.getPromise(q, events));

                var dhisEventPayload = {
                    'events': [{
                        'event': 'e1',
                        'eventDate': '2014-09-28',
                        'localStatus': "READY_FOR_DHIS"
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
