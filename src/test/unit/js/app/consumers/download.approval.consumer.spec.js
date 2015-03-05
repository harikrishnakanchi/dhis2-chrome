define(["downloadApprovalConsumer", "angularMocks", "properties", "utils", "datasetRepository", "userPreferenceRepository", "approvalService", "moment"],
    function(DownloadApprovalConsumer, mocks, properties, utils, DatasetRepository, UserPreferenceRepository, ApprovalService, moment) {
        describe("download data consumer", function() {

            var approvalDataRepository, datasetRepository, userPreferenceRepository, q, scope, downloadApprovalConsumer, message, approvalService;

            beforeEach(mocks.inject(function($q, $rootScope) {
                q = $q;
                scope = $rootScope.$new();

                userPreferenceRepository = {
                    "getUserModuleIds": jasmine.createSpy("getUserModuleIds").and.returnValue(utils.getPromise(q, ["org_0"]))
                };

                datasetRepository = {
                    "getAllDatasetIds": jasmine.createSpy("getAllDatasetIds").and.returnValue(utils.getPromise(q, ["DS_OPD"]))
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

                approvalService = {
                    "getAllLevelOneApprovalData": jasmine.createSpy("getAllLevelOneApprovalData").and.returnValue(utils.getPromise(q, [])),
                    "getAllLevelTwoApprovalData": jasmine.createSpy("getAllLevelTwoApprovalData").and.returnValue(utils.getPromise(q, [])),
                    "saveLevelOneApproval": jasmine.createSpy("saveLevelOneApproval"),
                    "saveLevelTwoApproval": jasmine.createSpy("saveLevelTwoApproval"),
                    "markAsComplete": jasmine.createSpy("markAsComplete"),
                    "markAsApproved": jasmine.createSpy("markAsApproved"),
                    "markAsIncomplete": jasmine.createSpy("markAsIncomplete")
                };

                downloadApprovalConsumer = new DownloadApprovalConsumer(datasetRepository, userPreferenceRepository, q, approvalService, approvalDataRepository);
            }));

            it("should download approval data from dhis based on user preferences and dataset", function() {
                userPreferenceRepository.getUserModuleIds.and.returnValue(utils.getPromise(q, ["mod1", "mod2", "mod3"]));

                datasetRepository.getAllDatasetIds.and.returnValue(utils.getPromise(q, ["ds1"]));

                message = {
                    "data": {
                        "type": "downloadData"
                    }
                };

                downloadApprovalConsumer.run(message);
                scope.$apply();

                expect(userPreferenceRepository.getUserModuleIds).toHaveBeenCalled();
                expect(datasetRepository.getAllDatasetIds).toHaveBeenCalled();

                expect(approvalService.getAllLevelOneApprovalData).toHaveBeenCalledWith(["mod1", "mod2", "mod3"], ["ds1"]);
                expect(approvalService.getAllLevelTwoApprovalData).toHaveBeenCalledWith(["mod1", "mod2", "mod3"], ["ds1"]);
            });

            it("should not save to indexeddb if no level one or level two approval data is available in dhis", function() {
                approvalService.getAllLevelOneApprovalData.and.returnValue(utils.getPromise(q, []));
                approvalService.getAllLevelTwoApprovalData.and.returnValue(utils.getPromise(q, []));

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

                downloadApprovalConsumer.run(message);
                scope.$apply();

                expect(approvalDataRepository.saveLevelOneApproval).not.toHaveBeenCalled();
                expect(approvalDataRepository.saveLevelTwoApproval).not.toHaveBeenCalled();
            });

            it("should save downloaded level one approval data to idb if approval data doesn't exist in idb", function() {
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

                downloadApprovalConsumer.run(message);
                scope.$apply();

                expect(approvalDataRepository.saveLevelOneApproval).toHaveBeenCalledWith(dhisApprovalData);
            });

            it("should save downloaded level two approval data to idb if approval data doesn't exist in idb", function() {
                var dhisApprovalData = [{
                    "period": "2014W01",
                    "orgUnit": "ou1",
                    "dataSets": ["d1", "d2"],
                    "isApproved": true,
                    "isAccepted": false,
                }, {
                    "period": "2014W02",
                    "orgUnit": "ou1",
                    "dataSets": ["d1", "d2"],
                    "isApproved": true,
                    "isAccepted": true
                }];

                approvalService.getAllLevelTwoApprovalData.and.returnValue(utils.getPromise(q, dhisApprovalData));

                message = {
                    "data": {
                        "type": "downloadData"
                    }
                };

                downloadApprovalConsumer.run(message);
                scope.$apply();

                expect(approvalDataRepository.saveLevelTwoApproval).toHaveBeenCalledWith(dhisApprovalData);
            });

            it("should merge level one approval data from dhis and idb based on status", function() {
                var dbApprovalWhichIsDeletedInDhis = {
                    "orgUnit": "ou1",
                    "period": "2014W01",
                    "storedBy": "testproj_approver2_l1",
                    "date": "2014-01-10T00:00:00.000+0000",
                    "dataSets": ["d1", "d2", "d3"]
                };

                var dbNewApproval = {
                    "orgUnit": "ou1",
                    "period": "2014W03",
                    "storedBy": "testproj_approver2_l1",
                    "date": "2014-01-10T00:00:00.000+0000",
                    "dataSets": ["d1", "d2", "d3"],
                    "status": "NEW"
                };

                var dbDeletedApproval = {
                    "orgUnit": "ou1",
                    "period": "2014W04",
                    "storedBy": "testproj_approver2_l1",
                    "date": "2014-01-10T00:00:00.000+0000",
                    "dataSets": ["d1", "d2", "d3"],
                    "status": "DELETED"
                };

                var dbStaleApprovalData = {
                    "orgUnit": "ou1",
                    "period": "2014W06",
                    "storedBy": "testproj_approver2_l1",
                    "date": "2014-01-10T00:00:00.000+0000",
                    "dataSets": ["d1", "d2", "d3"]
                };

                var dhisApprovalWithDifferentData = {
                    "orgUnit": dbStaleApprovalData.orgUnit,
                    "period": dbStaleApprovalData.period,
                    "storedBy": "testproj_approver3_l1",
                    "date": "2014-01-11T00:00:00.000+0000",
                    "dataSets": ["d1", "d2", "d3", "d4"],
                };

                var dhisNewApproval = {
                    "period": "2014W05",
                    "orgUnit": "ou1",
                    "storedBy": "testproj_approver_l1",
                    "date": "2014-01-05T00:00:00.000+0000",
                    "dataSets": ["d1", "d2"]
                };

                var dhisApprovalWhichIsDeletedLocally = {
                    "period": dbDeletedApproval.period,
                    "orgUnit": dbDeletedApproval.orgUnit,
                    "storedBy": dbDeletedApproval.storedBy,
                    "date": dbDeletedApproval.date,
                    "dataSets": dbDeletedApproval.dataSets
                };

                var dbApprovalData = [dbApprovalWhichIsDeletedInDhis, dbNewApproval, dbDeletedApproval, dbStaleApprovalData];
                var dhisApprovalData = [dhisApprovalWhichIsDeletedLocally, dhisNewApproval, dhisApprovalWithDifferentData];

                approvalService.getAllLevelOneApprovalData.and.returnValue(utils.getPromise(q, dhisApprovalData));
                approvalDataRepository.getLevelOneApprovalDataForPeriodsOrgUnits.and.returnValue(utils.getPromise(q, dbApprovalData));

                message = {
                    "data": {
                        "type": "downloadData"
                    }
                };

                downloadApprovalConsumer.run(message);
                scope.$apply();

                expect(approvalDataRepository.deleteLevelOneApproval).toHaveBeenCalledWith(dbApprovalWhichIsDeletedInDhis.period, dbApprovalWhichIsDeletedInDhis.orgUnit);
                expect(approvalDataRepository.deleteLevelOneApproval).not.toHaveBeenCalledWith(dbNewApproval.period, dbNewApproval.orgUnit);
                expect(approvalDataRepository.deleteLevelOneApproval).not.toHaveBeenCalledWith(dbDeletedApproval.period, dbDeletedApproval.orgUnit);
                expect(approvalDataRepository.saveLevelOneApproval).toHaveBeenCalledWith(dhisApprovalWithDifferentData);
                expect(approvalDataRepository.saveLevelOneApproval).toHaveBeenCalledWith([dhisNewApproval]);
            });

            it("should merge level two approval data from dhis and idb based on status", function() {
                var dbApprovalWhichIsDeletedInDhis = {
                    "orgUnit": "ou1",
                    "period": "2014W01",
                    "isApproved": true,
                    "isAccepted": false,
                    "dataSets": ["d1", "d2", "d3"]
                };

                var dbNewApproval = {
                    "orgUnit": "ou1",
                    "period": "2014W03",
                    "isApproved": true,
                    "isAccepted": false,
                    "dataSets": ["d1", "d2", "d3"],
                    "status": "NEW"
                };

                var dbDeletedApproval = {
                    "orgUnit": "ou1",
                    "period": "2014W04",
                    "isApproved": false,
                    "isAccepted": false,
                    "dataSets": ["d1", "d2", "d3"],
                    "status": "DELETED"
                };

                var dbStaleApprovalData = {
                    "orgUnit": "ou1",
                    "period": "2014W06",
                    "isApproved": true,
                    "isAccepted": false,
                    "dataSets": ["d1", "d2", "d3"]
                };

                var dhisApprovalWithDifferentData = {
                    "orgUnit": dbStaleApprovalData.orgUnit,
                    "period": dbStaleApprovalData.period,
                    "isApproved": true,
                    "isAccepted": true,
                    "dataSets": ["d1", "d2", "d3", "d4"],
                };

                var dhisNewApproval = {
                    "period": "2014W05",
                    "orgUnit": "ou1",
                    "isApproved": true,
                    "isAccepted": false,
                    "dataSets": ["d1", "d2"]
                };

                var dhisApprovalWhichIsDeletedLocally = {
                    "period": dbDeletedApproval.period,
                    "orgUnit": dbDeletedApproval.orgUnit,
                    "isApproved": true,
                    "isAccepted": false,
                    "dataSets": dbDeletedApproval.dataSets
                };

                var dbApprovalData = [dbApprovalWhichIsDeletedInDhis, dbNewApproval, dbDeletedApproval, dbStaleApprovalData];
                var dhisApprovalData = [dhisApprovalWhichIsDeletedLocally, dhisNewApproval, dhisApprovalWithDifferentData];

                approvalService.getAllLevelTwoApprovalData.and.returnValue(utils.getPromise(q, dhisApprovalData));
                approvalDataRepository.getLevelTwoApprovalDataForPeriodsOrgUnits.and.returnValue(utils.getPromise(q, dbApprovalData));

                message = {
                    "data": {
                        "type": "downloadData"
                    }
                };

                downloadApprovalConsumer.run(message);
                scope.$apply();

                expect(approvalDataRepository.deleteLevelTwoApproval).toHaveBeenCalledWith(dbApprovalWhichIsDeletedInDhis.period, dbApprovalWhichIsDeletedInDhis.orgUnit);
                expect(approvalDataRepository.deleteLevelTwoApproval).not.toHaveBeenCalledWith(dbNewApproval.period, dbNewApproval.orgUnit);
                expect(approvalDataRepository.deleteLevelTwoApproval).not.toHaveBeenCalledWith(dbDeletedApproval.period, dbDeletedApproval.orgUnit);
                expect(approvalDataRepository.saveLevelTwoApproval).toHaveBeenCalledWith(dhisApprovalWithDifferentData);
                expect(approvalDataRepository.saveLevelTwoApproval).toHaveBeenCalledWith([dhisNewApproval]);
            });
        });
    });
