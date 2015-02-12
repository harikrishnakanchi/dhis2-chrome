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
                    "value": 1
                }, {
                    "dataElement": "DE2",
                    "period": "2014W12",
                    "orgUnit": "MSF_0",
                    "categoryOptionCombo": "C1",
                    "lastUpdated": "2014-05-24T09:00:00.120Z",
                    "value": 2
                }];

                spyOn(dataRepository, "getDataValues").and.returnValue(utils.getPromise(q, dbDataValues));
                spyOn(dataService, "save");

                message = {
                    "data": {
                        "data": [{
                            "dataElement": "DE1",
                            "period": "2014W12",
                            "orgUnit": "MSF_0",
                            "categoryOptionCombo": "C1",
                            "lastUpdated": "2014-05-24T09:00:00.120Z",
                            "value": 1
                        }, {
                            "dataElement": "DE2",
                            "period": "2014W12",
                            "orgUnit": "MSF_0",
                            "categoryOptionCombo": "C1",
                            "lastUpdated": "2014-05-24T09:00:00.120Z",
                            "value": 2
                        }],
                        "type": "uploadDataValues"
                    }
                };

                uploadDataConsumer.run(message);
                scope.$apply();

                expect(dataRepository.getDataValues).toHaveBeenCalledWith("2014W12", "MSF_0");
                expect(dataService.save).toHaveBeenCalledWith(dbDataValues);
            });
        });
    });
