define(["downloadDataConsumer", "angularMocks", "properties", "utils", "dataService", "dataRepository", "datasetRepository", "userPreferenceRepository", "moment"],
    function(DownloadDataConsumer, mocks, properties, utils, DataService, DataRepository, DatasetRepository, UserPreferenceRepository, moment) {
        describe("download data consumer", function() {

            var dataService, dataRepository, approvalDataRepository, datasetRepository, userPreferenceRepository, q, scope, downloadDataConsumer, message, approvalService;

            beforeEach(mocks.inject(function($q, $rootScope) {
                q = $q;
                scope = $rootScope.$new();

                userPreferenceRepository = {
                    "getUserModuleIds": jasmine.createSpy("getUserModuleIds").and.returnValue(utils.getPromise(q, ["org_0"]))
                };

                datasetRepository = {
                    "getAllDatasetIds": jasmine.createSpy("getAllDatasetIds").and.returnValue(utils.getPromise(q, ["DS_OPD"]))
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
                    "getLevelTwoApprovalDataForPeriodsOrgUnits": jasmine.createSpy("getLevelTwoApprovalDataForPeriodsOrgUnits").and.returnValue(utils.getPromise(q, [])),
                    "saveLevelOneApproval": jasmine.createSpy("saveLevelOneApproval"),
                    "saveLevelTwoApproval": jasmine.createSpy("saveLevelTwoApproval"),
                    "deleteLevelOneApproval": jasmine.createSpy("deleteLevelOneApproval"),
                    "deleteLevelTwoApproval": jasmine.createSpy("deleteLevelTwoApproval")
                };

                dataService = {
                    "downloadAllData": jasmine.createSpy("downloadAllData").and.returnValue(utils.getPromise(q, [])),
                    "save": jasmine.createSpy("save")
                };

                downloadDataConsumer = new DownloadDataConsumer(dataService, dataRepository, datasetRepository, userPreferenceRepository, q, approvalDataRepository);
            }));

            it("should download data values from dhis based on user preferences and dataset", function() {
                userPreferenceRepository.getUserModuleIds.and.returnValue(utils.getPromise(q, ["mod1", "mod2", "mod3"]));

                datasetRepository.getAllDatasetIds.and.returnValue(utils.getPromise(q, ["ds1"]));

                message = {
                    "data": {
                        "type": "downloadData"
                    }
                };

                downloadDataConsumer.run(message);
                scope.$apply();

                expect(userPreferenceRepository.getUserModuleIds).toHaveBeenCalled();
                expect(datasetRepository.getAllDatasetIds).toHaveBeenCalled();
                expect(dataService.downloadAllData).toHaveBeenCalledWith(["mod1", "mod2", "mod3"], ['ds1']);
            });

            it("should not download data values if org units is not present", function() {
                userPreferenceRepository.getUserModuleIds.and.returnValue(utils.getPromise(q, []));
                message = {
                    "data": {
                        "type": "downloadData"
                    }
                };
                downloadDataConsumer.run(message);
                scope.$apply();

                expect(dataService.downloadAllData).not.toHaveBeenCalled();
            });

            it("should not download data values if dataSets is not present", function() {
                datasetRepository.getAllDatasetIds.and.returnValue(utils.getPromise(q, []));

                message = {
                    "data": {
                        "type": "downloadData"
                    }
                };
                downloadDataConsumer.run(message);
                scope.$apply();

                expect(dataService.downloadAllData).not.toHaveBeenCalled();
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
        });
    });