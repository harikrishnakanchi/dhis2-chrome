define(["downloadEventDataConsumer", "angularMocks", "properties", "utils", "eventService", "programEventRepository", "userPreferenceRepository"],
    function(DownloadEventDataConsumer, mocks, properties, utils, EventService, ProgramEventRepository, UserPreferenceRepository) {
        describe("download event data consumer", function() {
            var eventService, downloadEventDataConsumer, programEventRepository, userPreferenceRepository;
            beforeEach(mocks.inject(function($q, $rootScope) {
                q = $q;
                scope = $rootScope.$new();

                userPreferenceRepository = new UserPreferenceRepository();
                spyOn(userPreferenceRepository, "getCurrentUsersLineListOriginOrgUnitIds").and.returnValue(utils.getPromise(q, ["origin1", "origin2", "origin3", "origin4", "origin5"]));
                eventService = new EventService();
                programEventRepository = new ProgramEventRepository();
                downloadEventDataConsumer = new DownloadEventDataConsumer(eventService, programEventRepository, userPreferenceRepository, q);

            }));

            it("should download events from dhis and save them to indexeddb", function() {
                var dhisEventList = function(index) {
                    return {
                        'events': [{
                            'event': 'e' + index,
                            'eventDate': '2015-06-28T18:30:00.000Z'
                        }]
                    };
                };

                spyOn(programEventRepository, "isDataPresent").and.returnValue(utils.getPromise(q, true));
                spyOn(programEventRepository, "getEventsFromPeriod").and.returnValue(utils.getPromise(q, []));
                spyOn(programEventRepository, "delete").and.returnValue(utils.getPromise(q, []));
                spyOn(programEventRepository, "upsert");
                spyOn(eventService, "getRecentEvents").and.callFake(function(startDate, orgUnitId) {
                    if (orgUnitId == "origin1")
                        return utils.getPromise(q, dhisEventList(1));
                    if (orgUnitId == "origin2")
                        return utils.getPromise(q, dhisEventList(2));
                    if (orgUnitId == "origin3")
                        return utils.getPromise(q, dhisEventList(3));
                    if (orgUnitId == "origin4")
                        return utils.getPromise(q, dhisEventList(4));
                    if (orgUnitId == "origin5")
                        return utils.getPromise(q, dhisEventList(5));
                });

                var message = {
                    "data": {
                        "type": "downloadEventData"
                    }
                };

                downloadEventDataConsumer.run(message);
                scope.$apply();

                var expectedEventPayload = [{
                    'event': 'e5',
                    'eventDate': '2015-06-28T18:30:00.000Z'
                }, {
                    'event': 'e4',
                    'eventDate': '2015-06-28T18:30:00.000Z'
                }, {
                    'event': 'e3',
                    'eventDate': '2015-06-28T18:30:00.000Z'
                }, {
                    'event': 'e2',
                    'eventDate': '2015-06-28T18:30:00.000Z'
                }, {
                    'event': 'e1',
                    'eventDate': '2015-06-28T18:30:00.000Z'
                }];

                expect(eventService.getRecentEvents.calls.count()).toEqual(5);
                expect(programEventRepository.upsert).toHaveBeenCalledWith(expectedEventPayload);
            });

            it("should continue to download events from dhis even if one call fails", function() {
                var dhisEventList = function(index) {
                    return {
                        'events': [{
                            'event': 'e' + index,
                            'eventDate': '2015-06-28T18:30:00.000Z'
                        }]
                    };
                };

                spyOn(programEventRepository, "isDataPresent").and.returnValue(utils.getPromise(q, true));
                spyOn(programEventRepository, "getEventsFromPeriod").and.returnValue(utils.getPromise(q, []));
                spyOn(programEventRepository, "delete").and.returnValue(utils.getPromise(q, []));
                spyOn(programEventRepository, "upsert");
                spyOn(eventService, "getRecentEvents").and.callFake(function(startDate, orgUnitId) {
                    if (orgUnitId == "origin1")
                        return utils.getPromise(q, dhisEventList(1));
                    if (orgUnitId == "origin2")
                        return utils.getPromise(q, dhisEventList(2));
                    if (orgUnitId == "origin3")
                        return utils.getRejectedPromise(q, dhisEventList(3));
                    if (orgUnitId == "origin4")
                        return utils.getPromise(q, dhisEventList(4));
                    if (orgUnitId == "origin5")
                        return utils.getPromise(q, dhisEventList(5));
                });

                var message = {
                    "data": {
                        "type": "downloadEventData"
                    }
                };

                downloadEventDataConsumer.run(message);
                scope.$apply();

                var expectedEventPayload = [{
                    'event': 'e5',
                    'eventDate': '2015-06-28T18:30:00.000Z'
                }, {
                    'event': 'e4',
                    'eventDate': '2015-06-28T18:30:00.000Z'
                }, {
                    'event': 'e2',
                    'eventDate': '2015-06-28T18:30:00.000Z'
                }, {
                    'event': 'e1',
                    'eventDate': '2015-06-28T18:30:00.000Z'
                }];

                expect(eventService.getRecentEvents.calls.count()).toEqual(5);
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

                var upsertPayload = [dhisEventPresentInIndexedDB];

                expect(programEventRepository.upsert).toHaveBeenCalledWith(upsertPayload);
                expect(programEventRepository.delete).toHaveBeenCalledWith([dbEventNotPresentInDHIS.event]);
            });
        });
    });