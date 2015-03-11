define(["downloadDataConsumer", "angularMocks", "properties", "utils", "dataService", "dataRepository", "datasetRepository", "userPreferenceRepository", "moment", "timecop", "mergeBy"],
    function(DownloadDataConsumer, mocks, properties, utils, DataService, DataRepository, DatasetRepository, UserPreferenceRepository, moment, timecop, MergeBy) {
        describe("download data consumer", function() {

            var dataService, dataRepository, approvalDataRepository, datasetRepository, userPreferenceRepository, q, scope, downloadDataConsumer, message, approvalService, mergeBy;

            beforeEach(mocks.inject(function($q, $rootScope, $log) {
                q = $q;
                scope = $rootScope.$new();
                thisMoment = moment("2014-01-01T");

                Timecop.install();
                Timecop.freeze(thisMoment.toDate());

                userPreferenceRepository = new UserPreferenceRepository();
                spyOn(userPreferenceRepository, "getUserProjectIds").and.returnValue(utils.getPromise(q, ["org_0"]));

                datasetRepository = {
                    "getAllDatasetIds": jasmine.createSpy("getAllDatasetIds").and.returnValue(utils.getPromise(q, ["DS_OPD"]))
                };

                dataRepository = new DataRepository();
                spyOn(dataRepository, "getDataValues").and.returnValue(utils.getPromise(q, {}));
                spyOn(dataRepository, "getDataValuesForPeriodsOrgUnits").and.returnValue(utils.getPromise(q, {}));
                spyOn(dataRepository, "isDataPresent").and.returnValue(utils.getPromise(q, true));
                spyOn(dataRepository, "saveDhisData");

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

                mergeBy = new MergeBy($log);

                downloadDataConsumer = new DownloadDataConsumer(dataService, dataRepository, datasetRepository, userPreferenceRepository, q, approvalDataRepository, mergeBy);
            }));

            afterEach(function() {
                Timecop.returnToPresent();
                Timecop.uninstall();
            });

            it("should download data values from dhis based on user preferences and dataset", function() {
                userPreferenceRepository.getUserProjectIds.and.returnValue(utils.getPromise(q, ["mod1", "mod2", "mod3"]));

                datasetRepository.getAllDatasetIds.and.returnValue(utils.getPromise(q, ["ds1"]));

                message = {
                    "data": {
                        "type": "downloadData"
                    }
                };

                downloadDataConsumer.run(message);
                scope.$apply();

                expect(userPreferenceRepository.getUserProjectIds).toHaveBeenCalled();
                expect(datasetRepository.getAllDatasetIds).toHaveBeenCalled();
                expect(dataService.downloadAllData.calls.argsFor(0)).toEqual([
                    ["mod1"],
                    ['ds1'], '2013-10-09'
                ]);
                expect(dataService.downloadAllData.calls.argsFor(1)).toEqual([
                    ["mod2"],
                    ['ds1'], '2013-10-09'
                ]);
                expect(dataService.downloadAllData.calls.argsFor(2)).toEqual([
                    ["mod3"],
                    ['ds1'], '2013-10-09'
                ]);
            });

            it("should not download data values if org units is not present", function() {
                userPreferenceRepository.getUserProjectIds.and.returnValue(utils.getPromise(q, []));
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
                    "dataElement": "DE1",
                    "period": "2014W11",
                    "orgUnit": "MSF_0",
                    "categoryOptionCombo": "C1",
                    "lastUpdated": "2014-05-27T09:00:00.120Z",
                    "value": "5"
                }];

                dataRepository.getDataValuesForPeriodsOrgUnits.and.returnValue(utils.getPromise(q, dbDataValues));

                message = {
                    "data": {
                        "type": "downloadData"
                    }
                };

                downloadDataConsumer.run(message);
                scope.$apply();

                expect(dataRepository.saveDhisData).not.toHaveBeenCalled();
            });

            it("should save downloaded data to indexeddb if no data already exists in db", function() {
                var dhisDataValues = [{
                    "dataElement": "DE1",
                    "period": "2014W11",
                    "orgUnit": "MSF_0",
                    "categoryOptionCombo": "C1",
                    "lastUpdated": "2014-05-27T09:00:00.120Z",
                    "value": "5"
                }, {
                    "dataElement": "DE2",
                    "period": "2014W11",
                    "orgUnit": "MSF_0",
                    "categoryOptionCombo": "C1",
                    "lastUpdated": "2014-05-27T09:00:00.120Z",
                    "value": "10"
                }];

                dataService.downloadAllData.and.returnValue(utils.getPromise(q, dhisDataValues));

                dataRepository.getDataValuesForPeriodsOrgUnits.and.returnValue(utils.getPromise(q, []));

                message = {
                    "data": {
                        "type": "downloadData"
                    }
                };

                downloadDataConsumer.run(message);
                scope.$apply();

                var expected = [{
                    "dataElement": "DE1",
                    "period": "2014W11",
                    "orgUnit": "MSF_0",
                    "categoryOptionCombo": "C1",
                    "lastUpdated": "2014-05-27T09:00:00.120Z",
                    "value": "5"
                }, {
                    "dataElement": "DE2",
                    "period": "2014W11",
                    "orgUnit": "MSF_0",
                    "categoryOptionCombo": "C1",
                    "lastUpdated": "2014-05-27T09:00:00.120Z",
                    "value": "10"
                }];

                expect(dataRepository.saveDhisData).toHaveBeenCalledWith(expected);
            });

            it("should merge dhisData with existing db data, clear approvals where necessary, do the laundry and save to indexeddb", function() {
                var dhisDataValues = [{
                    "dataElement": "DE1",
                    "period": "2014W12",
                    "orgUnit": "MSF_0",
                    "categoryOptionCombo": "C1",
                    "lastUpdated": "2014-05-27T09:00:00.120Z",
                    "value": "1"
                }, {
                    "dataElement": "DE2",
                    "period": "2014W12",
                    "orgUnit": "MSF_0",
                    "categoryOptionCombo": "C1",
                    "lastUpdated": "2014-05-20T09:00:00.120Z",
                    "value": "2"
                }];

                var dbDataValues = [{
                    "dataElement": "DE1",
                    "period": "2014W12",
                    "orgUnit": "MSF_0",
                    "categoryOptionCombo": "C1",
                    "lastUpdated": "2014-05-24T09:00:00.120Z",
                    "value": "3"
                }, {
                    "dataElement": "DE2",
                    "period": "2014W12",
                    "orgUnit": "MSF_0",
                    "categoryOptionCombo": "C1",
                    "lastUpdated": "2014-05-23T09:00:00.120Z",
                    "clientLastUpdated": "2014-05-23T09:00:00.120Z",
                    "value": "4"
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

                var expectedDataConsumer = [{
                    "dataElement": "DE1",
                    "period": "2014W12",
                    "orgUnit": "MSF_0",
                    "categoryOptionCombo": "C1",
                    "lastUpdated": "2014-05-27T09:00:00.120Z",
                    "value": "1"
                }, {
                    "dataElement": "DE2",
                    "period": "2014W12",
                    "orgUnit": "MSF_0",
                    "categoryOptionCombo": "C1",
                    "lastUpdated": "2014-05-23T09:00:00.120Z",
                    "clientLastUpdated": "2014-05-23T09:00:00.120Z",
                    "value": "4"
                }];

                expect(approvalDataRepository.deleteLevelTwoApproval).toHaveBeenCalledWith('2014W12', 'MSF_0');
                expect(dataRepository.saveDhisData).toHaveBeenCalledWith(expectedDataConsumer);
            });

            it("should not clear approvals if downloaded data is the same as db data", function() {
                var dhisDataValues = [{
                    "dataElement": "DE1",
                    "period": "2014W12",
                    "orgUnit": "MSF_0",
                    "categoryOptionCombo": "C1",
                    "lastUpdated": "2014-05-27T10:00:00.120Z",
                    "createdDate": "2014-05-27T10:00:00.120Z",
                    "value": "1"
                }, {
                    "dataElement": "DE2",
                    "period": "2014W12",
                    "orgUnit": "MSF_0",
                    "categoryOptionCombo": "C1",
                    "lastUpdated": "2014-05-20T10:00:00.120Z",
                    "createdDate": "2014-05-27T10:00:00.120Z",
                    "value": "2"
                }];

                var dbDataValues = [{
                    "dataElement": "DE2",
                    "period": "2014W12",
                    "orgUnit": "MSF_0",
                    "categoryOptionCombo": "C1",
                    "clientLastUpdated": "2014-05-20T09:00:00.120Z",
                    "value": "2"
                }, {
                    "dataElement": "DE1",
                    "period": "2014W12",
                    "orgUnit": "MSF_0",
                    "categoryOptionCombo": "C1",
                    "clientLastUpdated": "2014-05-27T09:00:00.120Z",
                    "value": "1"
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

                expect(approvalDataRepository.deleteLevelOneApproval).not.toHaveBeenCalled();
                expect(approvalDataRepository.deleteLevelTwoApproval).not.toHaveBeenCalled();
                expect(dataRepository.saveDhisData).toHaveBeenCalledWith(dhisDataValues);
            });
        });
    });
