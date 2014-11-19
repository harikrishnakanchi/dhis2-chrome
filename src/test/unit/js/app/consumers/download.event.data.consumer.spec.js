define(["downloadEventDataConsumer", "angularMocks", "properties", "utils", "eventService", "programEventRepository"],
    function(DownloadEventDataConsumer, mocks, properties, utils, EventService, ProgramEventRepository) {
        describe("download event data consumer", function() {

            var eventService, downloadEventDataConsumer, programEventRepository;

            beforeEach(mocks.inject(function($q, $rootScope) {
                q = $q;
                scope = $rootScope.$new();

                eventService = new EventService();
                programEventRepository = new ProgramEventRepository();
                downloadEventDataConsumer = new DownloadEventDataConsumer(eventService, programEventRepository);
            }));

            it("should download events from dhis", function() {
                spyOn(eventService, "getRecentEvents").and.returnValue(utils.getPromise(q, []));
                spyOn(programEventRepository, "getEvents").and.returnValue(utils.getPromise(q, []));
                var message = {
                    "data": {
                        "type": "downloadEventData"
                    }
                };

                downloadEventDataConsumer.run(message);
                scope.$apply();

                expect(eventService.getRecentEvents).toHaveBeenCalled();
            });


            xit("should save downloaded events to indexeddb if no data already exists in db", function() {
                var dhisEventList = {
                    'events': [{
                        'event': 'e1',
                        'eventDate': '2010-11-07'
                    }]
                };

                spyOn(eventService, "getRecentEvents").and.returnValue(utils.getPromise(q, dhisEventList));
                spyOn(programEventRepository, "upsert");

                var message = {
                    "data": {
                        "type": "downloadEventData"
                    }
                };

                downloadEventDataConsumer.run(message);
                scope.$apply();

                var expectedEventData = [{
                    'event': 'e1',
                    'eventDate': '2010-11-07',
                    'period': '2010W44'
                }];

                expect(programEventRepository.upsert).toHaveBeenCalledWith(expectedEventData);
            });

            xit("should merge dhisData with existing db data, clear approvals where necessary, do the laundry and save to indexeddb", function() {
                var dhisDataValues = {
                    "dataValues": [{
                        "dataElement": "DE1",
                        "period": "2014W12",
                        "orgUnit": "MSF_0",
                        "categoryOptionCombo": "C1",
                        "lastUpdated": "2014-05-27T09:00:00.120Z",
                        "value": 2
                    }, {
                        "dataElement": "DE2",
                        "period": "2014W12",
                        "orgUnit": "MSF_0",
                        "categoryOptionCombo": "C1",
                        "lastUpdated": "2014-05-20T09:00:00.120Z",
                        "value": 1
                    }]
                };

                var dbDataValues = [{
                    "orgUnit": "MSF_0",
                    "period": "2014W12",
                    "dataValues": [{
                        "dataElement": "DE1",
                        "period": "2014W12",
                        "orgUnit": "MSF_0",
                        "categoryOptionCombo": "C1",
                        "lastUpdated": "2014-05-24T09:00:00.120Z",
                        "value": 1
                    }]
                }, {
                    "orgUnit": "MSF_0",
                    "period": "2014W12",
                    "dataValues": [{
                        "dataElement": "DE2",
                        "period": "2014W12",
                        "orgUnit": "MSF_0",
                        "categoryOptionCombo": "C1",
                        "lastUpdated": "2014-05-25T09:00:00.120Z",
                        "value": 2
                    }]
                }];

                dataService.downloadAllData.and.returnValue(utils.getPromise(q, dhisDataValues));

                dataRepository.getDataValuesForPeriodsOrgUnits.and.returnValue(utils.getPromise(q, dbDataValues));

                message = {
                    "data": {
                        "type": "downloadData"
                    }
                };

                downloadDataConsumer.run(message);
                scope.$apply();

                var expectedDataConsumer = {
                    "dataValues": [{
                        "dataElement": "DE1",
                        "period": "2014W12",
                        "orgUnit": "MSF_0",
                        "categoryOptionCombo": "C1",
                        "lastUpdated": "2014-05-27T09:00:00.120Z",
                        "value": 2
                    }, {
                        "dataElement": "DE2",
                        "period": "2014W12",
                        "orgUnit": "MSF_0",
                        "categoryOptionCombo": "C1",
                        "lastUpdated": "2014-05-25T09:00:00.120Z",
                        "value": 2
                    }]
                };

                expect(approvalDataRepository.deleteLevelTwoApproval).toHaveBeenCalledWith('2014W12', 'MSF_0');
                expect(dataRepository.save).toHaveBeenCalledWith(expectedDataConsumer);
            });


        });
    });