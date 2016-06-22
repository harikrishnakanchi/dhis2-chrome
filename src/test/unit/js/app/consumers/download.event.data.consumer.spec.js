define(["downloadEventDataConsumer", "angularMocks", "properties", "utils", "eventService", "programEventRepository", "userPreferenceRepository", "moduleDataBlockMerger"],
    function(DownloadEventDataConsumer, mocks, properties, utils, EventService, ProgramEventRepository, UserPreferenceRepository, ModuleDataBlockMerger) {
        describe("download event data consumer", function() {
            var eventService, downloadEventDataConsumer, programEventRepository, userPreferenceRepository, moduleDataBlockMerger;
            beforeEach(mocks.inject(function($q, $rootScope) {
                q = $q;
                scope = $rootScope.$new();

                userPreferenceRepository = new UserPreferenceRepository();
                spyOn(userPreferenceRepository, "getCurrentUsersLineListOriginOrgUnitIds").and.returnValue(utils.getPromise(q, ["origin1", "origin2", "origin3", "origin4", "origin5"]));
                eventService = new EventService();
                programEventRepository = new ProgramEventRepository();
                moduleDataBlockMerger = new ModuleDataBlockMerger();
                downloadEventDataConsumer = new DownloadEventDataConsumer(eventService, programEventRepository, userPreferenceRepository, moduleDataBlockMerger, q);
                spyOn(moduleDataBlockMerger, "mergeAndSaveEventsToLocalDatabase").and.returnValue(utils.getPromise(q, []));


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

                var localEvents = [];
                expect(eventService.getRecentEvents.calls.count()).toEqual(5);
                expect(moduleDataBlockMerger.mergeAndSaveEventsToLocalDatabase).toHaveBeenCalledWith(localEvents, expectedEventPayload);
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
            });
        });
    });