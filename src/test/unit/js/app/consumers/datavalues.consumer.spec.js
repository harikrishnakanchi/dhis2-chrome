define(["dataValuesConsumer", "angularMocks", "properties", "utils", "dataService", "dataRepository", "dataSetRepository", "userPreferenceRepository", "approvalService"],
    function(DataValuesConsumer, mocks, properties, utils, DataService, DataRepository, DataSetRepository, UserPreferenceRepository, ApprovalService) {
        describe("data values consumer", function() {

            var dataService, dataRepository, dataSetRepository, userPreferenceRepository, q, scope, allDataSets, userPref, dataValuesConsumer, message, approvalService;

            beforeEach(mocks.inject(function($q, $rootScope) {
                q = $q;
                scope = $rootScope.$new();

                userPref = [{
                    "orgUnits": [{
                        "id": "org_0"
                    }]
                }];

                allDataSets = [{
                    "id": "DS_OPD"
                }];

                userPreferenceRepository = {
                    "getAll": jasmine.createSpy("getAll").and.returnValue(utils.getPromise(q, userPref))
                };

                dataSetRepository = {
                    "getAll": jasmine.createSpy("getAll").and.returnValue(utils.getPromise(q, allDataSets))
                };

                dataRepository = {
                    "getDataValues": jasmine.createSpy("getDataValues").and.returnValue(utils.getPromise(q, {})),
                    "getDataValuesForPeriodsOrgUnits": jasmine.createSpy("getDataValuesForPeriodsOrgUnits").and.returnValue(utils.getPromise(q, {})),
                    "save": jasmine.createSpy("save")
                };

                dataService = {
                    "downloadAllData": jasmine.createSpy("downloadAllData").and.returnValue(utils.getPromise(q, [])),
                    "save": jasmine.createSpy("save")
                };

                approvalService = {
                    "getAllLevelOneApprovalData": jasmine.createSpy("getAllLevelOneApprovalData").and.returnValue(utils.getPromise(q, [])),
                    "save": jasmine.createSpy("save")
                };

                dataValuesConsumer = new DataValuesConsumer(dataService, dataRepository, dataSetRepository, userPreferenceRepository, q, approvalService);
            }));

            it("should download data values from dhis based on user preferences and dataset metadata", function() {
                userPreferenceRepository.getAll.and.returnValue(utils.getPromise(q, [{
                    "orgUnits": [{
                        "id": "ou1"
                    }]
                }]));

                dataSetRepository.getAll.and.returnValue(utils.getPromise(q, [{
                    "id": "ds1"
                }]));

                message = {
                    "data": {
                        "type": "downloadData"
                    }
                };

                dataValuesConsumer.run(message);
                scope.$apply();

                expect(userPreferenceRepository.getAll).toHaveBeenCalled();
                expect(dataSetRepository.getAll).toHaveBeenCalled();
                expect(dataService.downloadAllData).toHaveBeenCalledWith(['ou1'], [{
                    id: 'ds1'
                }]);
            });

            it("should fire and forget download data value calls", function() {
                userPreferenceRepository.getAll.and.returnValue(utils.getPromise(q, [{
                    "orgUnits": [{
                        "id": "ou1"
                    }]
                }]));
                dataSetRepository.getAll.and.returnValue(utils.getPromise(q, [{
                    "id": "ds1"
                }]));
                dataService.downloadAllData.and.returnValue(utils.getRejectedPromise(q, {}));

                message = {
                    "data": {
                        "type": "downloadData"
                    }
                };
                var success = jasmine.createSpy("success");
                var failure = jasmine.createSpy("failure");

                q.when(dataValuesConsumer.run(message)).then(success, failure);
                scope.$apply();

                expect(success).toHaveBeenCalled();
                expect(failure).not.toHaveBeenCalled();
                expect(userPreferenceRepository.getAll).toHaveBeenCalled();
                expect(dataSetRepository.getAll).toHaveBeenCalled();
                expect(dataService.downloadAllData).toHaveBeenCalledWith(['ou1'], [{
                    id: 'ds1'
                }]);
            });

            it("should save the same data back to indexeddb if no data is available in dhis", function() {

                dataService.downloadAllData.and.returnValue(utils.getPromise(q, []));

                var dbDataValues = [{
                    "orgUnit": "MSF_0",
                    "period": "2014W11",
                    "dataValues": [{
                        "dataElement": "DE1",
                        "period": "2014W11",
                        "orgUnit": "MSF_0",
                        "categoryOptionCombo": "C1",
                        "lastUpdated": "2014-05-27T09:00:00.120Z",
                        "value": 5
                    }]
                }, {
                    "orgUnit": "MSF_0",
                    "period": "2014W12",
                    "dataValues": [{
                        "dataElement": "DE1",
                        "period": "2014W12",
                        "orgUnit": "MSF_0",
                        "categoryOptionCombo": "C1",
                        "lastUpdated": "2014-05-27T09:00:00.120Z",
                        "value": 1
                    }]
                }];

                dataRepository.getDataValuesForPeriodsOrgUnits.and.returnValue(utils.getPromise(q, dbDataValues));

                message = {
                    "data": {
                        "type": "downloadData"
                    }
                };

                dataValuesConsumer.run(message);
                scope.$apply();

                var expected = {
                    "dataValues": [{
                        "dataElement": "DE1",
                        "period": "2014W11",
                        "orgUnit": "MSF_0",
                        "categoryOptionCombo": "C1",
                        "lastUpdated": "2014-05-27T09:00:00.120Z",
                        "value": 5
                    }, {
                        "dataElement": "DE1",
                        "period": "2014W12",
                        "orgUnit": "MSF_0",
                        "categoryOptionCombo": "C1",
                        "lastUpdated": "2014-05-27T09:00:00.120Z",
                        "value": 1
                    }]
                };

                expect(dataRepository.save).toHaveBeenCalledWith(expected);
            });

            it("should save downloaded data to indexeddb if no data already exists in db", function() {

                var dhisDataValues = {
                    "dataValues": [{
                        "dataElement": "DE1",
                        "period": "2014W11",
                        "orgUnit": "MSF_0",
                        "categoryOptionCombo": "C1",
                        "lastUpdated": "2014-05-27T09:00:00.120Z",
                        "value": 5
                    }, {
                        "dataElement": "DE2",
                        "period": "2014W11",
                        "orgUnit": "MSF_0",
                        "categoryOptionCombo": "C1",
                        "lastUpdated": "2014-05-27T09:00:00.120Z",
                        "value": 10
                    }]
                };

                dataService.downloadAllData.and.returnValue(utils.getPromise(q, dhisDataValues));

                dataRepository.getDataValuesForPeriodsOrgUnits.and.returnValue(utils.getPromise(q, []));

                message = {
                    "data": {
                        "type": "downloadData"
                    }
                };

                dataValuesConsumer.run(message);
                scope.$apply();

                var expected = {
                    "dataValues": [{
                        "dataElement": "DE1",
                        "period": "2014W11",
                        "orgUnit": "MSF_0",
                        "categoryOptionCombo": "C1",
                        "lastUpdated": "2014-05-27T09:00:00.120Z",
                        "value": 5
                    }, {
                        "dataElement": "DE2",
                        "period": "2014W11",
                        "orgUnit": "MSF_0",
                        "categoryOptionCombo": "C1",
                        "lastUpdated": "2014-05-27T09:00:00.120Z",
                        "value": 10
                    }]
                };

                expect(dataRepository.save).toHaveBeenCalledWith(expected);
            });

            it("should merge dhisData with existing db data and save to indexeddb", function() {
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

                dataValuesConsumer.run(message);
                scope.$apply();

                var expectedDataValues = {
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

                expect(dataRepository.save).toHaveBeenCalledWith(expectedDataValues);
            });

            it("should not download data values if org units is not present", function() {
                userPreferenceRepository.getAll.and.returnValue(utils.getPromise(q, {}));
                message = {
                    "data": {
                        "type": "downloadData"
                    }
                };
                dataValuesConsumer.run(message);
                scope.$apply();

                expect(dataService.downloadAllData).not.toHaveBeenCalled();
            });

            it("should not download data values if dataSets is not present", function() {
                dataSetRepository.getAll.and.returnValue(utils.getPromise(q, {}));

                message = {
                    "data": {
                        "type": "downloadData"
                    }
                };
                dataValuesConsumer.run(message);
                scope.$apply();

                expect(dataService.downloadAllData).not.toHaveBeenCalled();
            });

            xit("should download approval data", function() {

                var completionData = {
                    "blah": true
                };

                var userPref = [{
                    "orgUnits": [{
                        "id": "org_0"
                    }]
                }];

                var allDataSets = [{
                    "id": "DS_OPD"
                }];

                userPreferenceRepository.getAll.and.returnValue(utils.getPromise(q, userPref));
                dataSetRepository.getAll.and.returnValue(utils.getPromise(q, allDataSets));
                approvalService.getAllLevelOneApprovalData.and.returnValue(utils.getPromise(q, completionData));
                dataValuesConsumer.run({
                    "data": {
                        "type": "downloadData"
                    }
                });
                scope.$apply();

                expect(approvalService.getAllLevelOneApprovalData).toHaveBeenCalledWith(["org_0"], ["DS_OPD"]);
                expect(approvalService.save).toHaveBeenCalledWith(completionData);
            });

            xit("should abort approval data download if no orgunits are found in user pref", function() {
                var allDataSets = [{
                    "id": "DS_OPD"
                }];

                spyOn(userPreferenceRepository, "getAll").and.returnValue(utils.getPromise(q, undefined));
                spyOn(dataSetRepository, "getAll").and.returnValue(utils.getPromise(q, allDataSets));
                spyOn(approvalService, "getAllLevelOneApprovalData");
                spyOn(approvalService, "save");

                dataValuesConsumer.run({
                    "data": {
                        "type": "downloadApprovalData"
                    }
                });
                scope.$apply();

                expect(approvalService.getAllLevelOneApprovalData).not.toHaveBeenCalled();
                expect(approvalService.save).not.toHaveBeenCalled();
            });

            it("should upload data to DHIS", function() {
                var dbDataValues = {
                    "orgUnit": "MSF_0",
                    "period": "2014W12",
                    "dataValues": [{
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
                    }]
                };

                dataRepository.getDataValues.and.returnValue(utils.getPromise(q, dbDataValues));

                message = {
                    "data": {
                        "data": {
                            "dataValues": [{
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
                            }]
                        },
                        "type": "uploadDataValues"
                    }
                };

                dataValuesConsumer.run(message);
                scope.$apply();

                expect(dataService.save).toHaveBeenCalledWith(dbDataValues);
            });
        });
    });