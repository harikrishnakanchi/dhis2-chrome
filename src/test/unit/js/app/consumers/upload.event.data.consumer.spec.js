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
                    'event': 'ev1',
                    'eventDate': '2014-09-28',
                    'localStatus': 'READY_FOR_DHIS'
                }, {
                    'event': 'ev2',
                    'eventDate': '2014-09-29',
                    'localStatus': 'READY_FOR_DHIS'
                }];

                spyOn(programEventRepository, 'getEventsForUpload').and.returnValue(utils.getPromise(q, events));
                spyOn(eventService, 'upsertEvents').and.returnValue(utils.getPromise(q, {}));
                spyOn(programEventRepository, 'upsert').and.returnValue(utils.getPromise(q, {}));

                var message = {
                    'data': {
                        'data': ['ev1', 'ev2']
                    }
                };

                uploadEventDataConsumer.run(message);
                scope.$apply();

                var expectedEventUpserts = _.map(events, function (event) {
                    return _.omit(event, ['localStatus']);
                });

                expect(programEventRepository.getEventsForUpload).toHaveBeenCalledWith(message.data.data);
                expect(eventService.upsertEvents).toHaveBeenCalledWith(events);
                expect(programEventRepository.upsert).toHaveBeenCalledWith(expectedEventUpserts);
            });
        });
    });