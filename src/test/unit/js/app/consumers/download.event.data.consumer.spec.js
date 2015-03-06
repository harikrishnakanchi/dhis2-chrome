define(["downloadEventDataConsumer", "angularMocks", "properties", "utils", "eventService", "programEventRepository"],
    function(DownloadEventDataConsumer, mocks, properties, utils, EventService, ProgramEventRepository) {
        describe("download event data consumer", function() {
            var eventService, downloadEventDataConsumer, programEventRepository;
            beforeEach(mocks.inject(function($q, $rootScope) {
                q = $q;
                scope = $rootScope.$new();

                eventService = new EventService();
                programEventRepository = new ProgramEventRepository();
                downloadEventDataConsumer = new DownloadEventDataConsumer(eventService, programEventRepository, q);
            }));

            it("should download events from dhis and save them to indexeddb", function() {
                var dhisEventList = {
                    'events': [{
                        'event': 'e1',
                        'eventDate': '2014-09-28'
                    }]
                };

                spyOn(programEventRepository, "isDataPresent").and.returnValue(utils.getPromise(q, true));
                spyOn(eventService, "getRecentEvents").and.returnValue(utils.getPromise(q, dhisEventList));
                spyOn(programEventRepository, "getEventsFromPeriod").and.returnValue(utils.getPromise(q, []));
                spyOn(programEventRepository, "delete").and.returnValue(utils.getPromise(q, []));
                spyOn(programEventRepository, "upsert");

                var message = {
                    "data": {
                        "type": "downloadEventData"
                    }
                };

                downloadEventDataConsumer.run(message);
                scope.$apply();

                var expectedEventPayload = {
                    events: [{
                        event: 'e1',
                        eventDate: '2014-09-28'
                    }]
                };

                expect(eventService.getRecentEvents).toHaveBeenCalled();
                expect(programEventRepository.upsert).toHaveBeenCalledWith(expectedEventPayload);
            });

            it("should merge dhisEvents with existing indexeddb events, clear events where necessary, and save to indexeddb", function() {
                var dhisEventPresentInIndexedDB = {
                    'event': 'e2',
                    'eventDate': '2014-09-28'
                };

                var dhisEventList = {
                    'events': [dhisEventPresentInIndexedDB]
                };

                var dbEventNotPresentInDHIS = {
                    'event': 'e3',
                    'eventDate': '2014-09-28'
                };

                var dbEventPresentInDHIS = {
                    'event': 'e2',
                    'eventDate': '2014-09-27'
                };

                var dbEventList = [dbEventPresentInDHIS, dbEventNotPresentInDHIS];

                spyOn(programEventRepository, "isDataPresent").and.returnValue(utils.getPromise(q, true));
                spyOn(eventService, "getRecentEvents").and.returnValue(utils.getPromise(q, dhisEventList));
                spyOn(programEventRepository, "getEventsFromPeriod").and.returnValue(utils.getPromise(q, dbEventList));
                spyOn(programEventRepository, "delete");
                spyOn(programEventRepository, "upsert");

                var message = {
                    "data": {
                        "type": "downloadEventData"
                    }
                };

                downloadEventDataConsumer.run(message);
                scope.$apply();

                var upsertPayload = {
                    events: [dhisEventPresentInIndexedDB]
                };

                expect(programEventRepository.upsert).toHaveBeenCalledWith(upsertPayload);
                expect(programEventRepository.delete).toHaveBeenCalledWith([dbEventNotPresentInDHIS.event]);
            });
        });
    });
