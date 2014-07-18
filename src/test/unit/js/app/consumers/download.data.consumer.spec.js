define(["downloadDataConsumer", "angularMocks", "properties", "utils", "dataService", "dataRepository", "dataSetRepository", "userPreferenceRepository", "approvalService", "moment"],
    function(DownloadDataConsumer, mocks, properties, utils, DataService, DataRepository, DataSetRepository, UserPreferenceRepository, ApprovalService, moment) {
        describe("download data consumer", function() {

            var dataService, dataRepository, approvalDataRepository, dataSetRepository, userPreferenceRepository, q, scope, allDataSets, userPref, downloadDataConsumer, message, approvalService;

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

                approvalDataRepository = {
                    "getLevelOneApprovalData": jasmine.createSpy("getLevelOneApprovalData").and.returnValue(utils.getPromise(q, {})),
                    "getLevelTwoApprovalData": jasmine.createSpy("getLevelTwoApprovalData").and.returnValue(utils.getPromise(q, {})),
                    "getLevelOneApprovalDataForPeriodsOrgUnits": jasmine.createSpy("getLevelOneApprovalDataForPeriodsOrgUnits").and.returnValue(utils.getPromise(q, [])),
                    "saveLevelOneApproval": jasmine.createSpy("saveLevelOneApproval"),
                    "saveLevelTwoApproval": jasmine.createSpy("saveLevelTwoApproval"),
                    "deleteLevelOneApproval": jasmine.createSpy("deleteLevelOneApproval"),
                    "deleteLevelTwoApproval": jasmine.createSpy("deleteLevelTwoApproval")
                };

                dataService = {
                    "downloadAllData": jasmine.createSpy("downloadAllData").and.returnValue(utils.getPromise(q, [])),
                    "save": jasmine.createSpy("save")
                };

                approvalService = {
                    "getAllLevelOneApprovalData": jasmine.createSpy("getAllLevelOneApprovalData").and.returnValue(utils.getPromise(q, [])),
                    "getAllLevelTwoApprovalData": jasmine.createSpy("getAllLevelTwoApprovalData").and.returnValue(utils.getPromise(q, [])),
                    "saveLevelOneApproval": jasmine.createSpy("saveLevelOneApproval"),
                    "saveLevelTwoApproval": jasmine.createSpy("saveLevelTwoApproval"),
                    "markAsComplete": jasmine.createSpy("markAsComplete"),
                    "markAsApproved": jasmine.createSpy("markAsApproved"),
                    "markAsIncomplete": jasmine.createSpy("markAsIncomplete")
                };

                downloadDataConsumer = new DownloadDataConsumer(dataService, dataRepository, dataSetRepository, userPreferenceRepository, q, approvalService, approvalDataRepository);
            }));

            it("should download data values and approval data from dhis based on user preferences and dataset metadata", function() {
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

                downloadDataConsumer.run(message);
                scope.$apply();

                expect(userPreferenceRepository.getAll).toHaveBeenCalled();
                expect(dataSetRepository.getAll).toHaveBeenCalled();

                expect(dataService.downloadAllData).toHaveBeenCalledWith(['ou1'], [{
                    id: 'ds1'
                }]);

                expect(approvalService.getAllLevelOneApprovalData).toHaveBeenCalledWith(["ou1"], ["ds1"]);
            });

            it("should not download data values if org units is not present", function() {
                userPreferenceRepository.getAll.and.returnValue(utils.getPromise(q, {}));
                message = {
                    "data": {
                        "type": "downloadData"
                    }
                };
                downloadDataConsumer.run(message);
                scope.$apply();

                expect(dataService.downloadAllData).not.toHaveBeenCalled();
                expect(approvalService.getAllLevelOneApprovalData).not.toHaveBeenCalled();
            });

            it("should not download data values if dataSets is not present", function() {
                dataSetRepository.getAll.and.returnValue(utils.getPromise(q, {}));

                message = {
                    "data": {
                        "type": "downloadData"
                    }
                };
                downloadDataConsumer.run(message);
                scope.$apply();

                expect(dataService.downloadAllData).not.toHaveBeenCalled();
                expect(approvalService.getAllLevelOneApprovalData).not.toHaveBeenCalled();
            });

            xit("should work with pre-defined number of weeks while syncing data values and approval data", function() {
                message = {
                    "data": {
                        "type": "downloadData"
                    }
                };

                downloadDataConsumer.run(message);
                scope.$apply();

                expect(dataRepository.getDataValuesForPeriodsOrgUnits).toHaveBeenCalledWith("2014W24", "2014W27", ["org_0"]);
                expect(dataRepository.getLevelOneApprovalDataForPeriodsOrgUnits).toHaveBeenCalledWith("2014W24", "2014W27", ["org_0"]);
            });

            it("should not save to indexeddb if no data is available in dhis", function() {
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
                }];

                dataRepository.getDataValuesForPeriodsOrgUnits.and.returnValue(utils.getPromise(q, dbDataValues));

                message = {
                    "data": {
                        "type": "downloadData"
                    }
                };

                downloadDataConsumer.run(message);
                scope.$apply();

                expect(dataRepository.save).not.toHaveBeenCalled();
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

                downloadDataConsumer.run(message);
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

            it("should merge dhisData with existing db data, clear approvals where necessary, do the laundry and save to indexeddb", function() {
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

            it("should not save to indexeddb if no approval data is available in dhis", function() {
                approvalService.getAllLevelOneApprovalData.and.returnValue(utils.getPromise(q, []));

                var dbData = {
                    "orgUnit": "ou1",
                    "period": "2014W01",
                    "storedBy": "testproj_approver_l1",
                    "date": "2014-01-03T00:00:00.000+0000",
                    "dataSets": ["d1", "d2", "d3"]
                };

                approvalDataRepository.getLevelOneApprovalData.and.returnValue(utils.getPromise(q, dbData));
                message = {
                    "data": {
                        "type": "downloadData"
                    }
                };

                downloadDataConsumer.run(message);
                scope.$apply();

                expect(approvalDataRepository.saveLevelOneApproval).not.toHaveBeenCalled();
            });

            it("should save downloaded approval data to idb if approval data doesn't exist in idb", function() {
                var dhisApprovalData = [{
                    "period": "2014W01",
                    "orgUnit": "ou1",
                    "storedBy": "testproj_approver_l1",
                    "date": "2014-01-05T00:00:00.000+0000",
                    "dataSets": ["d1", "d2"]
                }, {
                    "period": "2014W02",
                    "orgUnit": "ou1",
                    "storedBy": "testproj_approver_l1",
                    "date": "2014-01-05T00:00:00.000+0000",
                    "dataSets": ["d1", "d2"]
                }];

                approvalService.getAllLevelOneApprovalData.and.returnValue(utils.getPromise(q, dhisApprovalData));

                message = {
                    "data": {
                        "type": "downloadData"
                    }
                };

                downloadDataConsumer.run(message);
                scope.$apply();

                expect(approvalDataRepository.saveLevelOneApproval).toHaveBeenCalledWith(dhisApprovalData);
            });

            it("should merge dhis approval data and idb approval data based on last modified time", function() {
                var dbApprovalData = [{
                    "orgUnit": "ou1",
                    "period": "2014W01",
                    "storedBy": "testproj_approver2_l1",
                    "date": "2014-01-10T00:00:00.000+0000",
                    "dataSets": ["d1", "d2", "d3"]
                }, {
                    "orgUnit": "ou1",
                    "period": "2014W03",
                    "storedBy": "testproj_approver2_l1",
                    "date": "2014-01-10T00:00:00.000+0000",
                    "dataSets": ["d1", "d2", "d3"],
                    "status": "NEW"
                }, {
                    "orgUnit": "ou1",
                    "period": "2014W04",
                    "storedBy": "testproj_approver2_l1",
                    "date": "2014-01-10T00:00:00.000+0000",
                    "dataSets": ["d1", "d2", "d3"],
                    "status": "DELETED"
                }, {
                    "orgUnit": "ou1",
                    "period": "2014W06",
                    "storedBy": "testproj_approver2_l1",
                    "date": "2014-01-10T00:00:00.000+0000",
                    "dataSets": ["d1", "d2", "d3"],
                }];

                var dhisApprovalWithDifferentData = {
                    "orgUnit": "ou1",
                    "period": "2014W06",
                    "storedBy": "testproj_approver3_l1",
                    "date": "2014-01-10T00:00:00.000+0000",
                    "dataSets": ["d1", "d2", "d3"],
                };
                var dhisNewApproval = {
                    "period": "2014W05",
                    "orgUnit": "ou1",
                    "storedBy": "testproj_approver_l1",
                    "date": "2014-01-05T00:00:00.000+0000",
                    "dataSets": ["d1", "d2"]
                };

                var dhisApprovalData = [{
                        "period": "2014W04",
                        "orgUnit": "ou1",
                        "storedBy": "testproj_approver_l1",
                        "date": "2014-01-05T00:00:00.000+0000",
                        "dataSets": ["d1", "d2"]
                    },
                    dhisNewApproval,
                    dhisApprovalWithDifferentData
                ];

                approvalService.getAllLevelOneApprovalData.and.returnValue(utils.getPromise(q, dhisApprovalData));
                approvalDataRepository.getLevelOneApprovalDataForPeriodsOrgUnits.and.returnValue(utils.getPromise(q, dbApprovalData));

                message = {
                    "data": {
                        "type": "downloadData"
                    }
                };

                downloadDataConsumer.run(message);
                scope.$apply();

                expect(approvalDataRepository.deleteLevelOneApproval).toHaveBeenCalledWith("2014W01", "ou1");
                expect(approvalDataRepository.deleteLevelOneApproval).not.toHaveBeenCalledWith("2014W03", "ou1");
                expect(approvalDataRepository.deleteLevelOneApproval).not.toHaveBeenCalledWith("2014W04", "ou1");
                expect(approvalDataRepository.saveLevelOneApproval).toHaveBeenCalledWith(dhisApprovalWithDifferentData);
                expect(approvalDataRepository.saveLevelOneApproval).toHaveBeenCalledWith([dhisNewApproval]);
            });
        });
    });