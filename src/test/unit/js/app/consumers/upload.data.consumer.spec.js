define(["uploadDataConsumer", "angularMocks", "dataService", "dataRepository", "utils"],
    function(UploadDataConsumer, mocks, DataService, DataRepository, utils) {
        describe("upload data consumer", function() {
            var dataRepository, uploadDataConsumer, scope, q;

            beforeEach(mocks.inject(function($q, $rootScope) {
                dataRepository = new DataRepository();
                dataService = new DataService();
                uploadDataConsumer = new UploadDataConsumer(dataService, dataRepository);
                scope = $rootScope.$new();
                q = $q;
            }));

            it("should upload data to DHIS", function() {
                var dbDataValues = [{
                    "dataElement": "DE1",
                    "period": "2014W12",
                    "orgUnit": "MSF_0",
                    "categoryOptionCombo": "C1",
                    "lastUpdated": "2014-05-24T09:00:00.120Z",
                    "value": "1"
                }, {
                    "dataElement": "DE2",
                    "period": "2014W12",
                    "orgUnit": "MSF_0",
                    "categoryOptionCombo": "C1",
                    "lastUpdated": "2014-05-24T09:00:00.120Z",
                    "value": "2"
                }, {
                    "dataElement": "NumPatients",
                    "period": "2014W12",
                    "orgUnit": "Origin1",
                    "categoryOptionCombo": "Number",
                    "lastUpdated": "2014-05-24T09:00:00.120Z",
                    "value": "3"
                }];

                spyOn(dataRepository, "getDataValues").and.returnValue(utils.getPromise(q, dbDataValues));
                spyOn(dataRepository, "setLocalStatus").and.returnValue(utils.getPromise(q, []));
                spyOn(dataService, "save");

                message = {
                    "data": {
                        "data": [{
                            "period": "2014W12",
                            "orgUnit": "MSF_0"
                        }, {
                            "period": "2014W12",
                            "orgUnit": "MSF_0"
                        }, {
                            "period": "2014W12",
                            "orgUnit": "Origin1"
                        }],
                        "type": "uploadDataValues"
                    }
                };

                uploadDataConsumer.run(message);
                scope.$apply();

                expect(dataRepository.getDataValues).toHaveBeenCalledWith("2014W12", ["MSF_0", "Origin1"]);
                expect(dataService.save).toHaveBeenCalledWith(dbDataValues);
            });

            it("should set localStatus attribute of periodAndOrgUnit data to 'SYNCED_TO_DHIS' after succesful sync to DHIS", function() {

                var dbDataValues = [{
                    "orgUnit": "ou1",
                    "period": "2016W01",
                    "dataValues": [{
                        "period": '2016W01',
                        "orgUnit": 'ou1',
                        "dataElement": "DE2",
                        "categoryOptionCombo": "COC2",
                        "value": "2",
                        "lastUpdated": "2014-01-15T00:00:00.000"
                    }],
                    "localStatus": "WAITING_TO_SYNC"
                }, {
                    "orgUnit": "ou2",
                    "period": "2016W02",
                    "dataValues": [{
                        "period": '2016W02',
                        "orgUnit": 'ou2',
                        "dataElement": "DE2",
                        "categoryOptionCombo": "COC2",
                        "value": "4",
                        "isDraft": true,
                        "clientLastUpdated": "2014-01-22T00:00:00.000"
                    }],
                    "localStatus": "WAITING_TO_SYNC"
                }];

                spyOn(dataRepository, "getDataValues").and.returnValue(utils.getPromise(q, dbDataValues));
                spyOn(dataRepository, "setLocalStatus").and.returnValue(utils.getPromise(q, []));
                spyOn(dataService, "save");

                message = {
                    "data": {
                        "data": [{
                            "period": "2016W01",
                            "orgUnit": "ou1"
                        }, {
                            "period": "2016W02",
                            "orgUnit": "ou2"
                        }],
                        "type": "uploadDataValues"
                    }
                };

                uploadDataConsumer.run(message);
                scope.$apply();

                expect(dataRepository.setLocalStatus).toHaveBeenCalledWith(message.data.data, "SYNCED_TO_DHIS");

            });
        });
    });
