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
                    "getApprovalDataForPeriodsOrgUnits": jasmine.createSpy("getApprovalDataForPeriodsOrgUnits").and.returnValue(utils.getPromise(q, [])),
                    "saveApprovalsFromDhis": jasmine.createSpy("saveApprovalsFromDhis"),
                    "invalidateApproval": jasmine.createSpy("invalidateApproval")
                };

                approvalService = {
                    "getAllLevelOneApprovalData": jasmine.createSpy("getAllLevelOneApprovalData").and.returnValue(utils.getPromise(q, [])),
                    "getAllLevelTwoApprovalData": jasmine.createSpy("getAllLevelTwoApprovalData").and.returnValue(utils.getPromise(q, [])),
                    "saveApprovalsFromDhis": jasmine.createSpy("saveApprovalsFromDhis"),
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

                expect(approvalDataRepository.saveApprovalsFromDhis).not.toHaveBeenCalled();
                expect(approvalDataRepository.saveApprovalsFromDhis).not.toHaveBeenCalled();
            });

            it("should save downloaded level one approval data to idb if approval data doesn't exist in idb", function() {
                var dhisApprovalData = [{
                    "period": "2014W01",
                    "orgUnit": "ou1",
                    "completedBy": "testproj_approver_l1",
                    "completedOn": "2014-01-05T00:00:00.000+0000"
                }, {
                    "period": "2014W02",
                    "orgUnit": "ou1",
                    "completedBy": "testproj_approver_l1",
                    "completedOn": "2014-01-05T00:00:00.000+0000"
                }];

                approvalService.getAllLevelOneApprovalData.and.returnValue(utils.getPromise(q, dhisApprovalData));

                message = {
                    "data": {
                        "type": "downloadData"
                    }
                };

                downloadApprovalConsumer.run(message);
                scope.$apply();

                expect(approvalDataRepository.saveApprovalsFromDhis).toHaveBeenCalledWith(dhisApprovalData);
            });

            it("should save downloaded level two approval data to idb if approval data doesn't exist in idb", function() {
                var dhisApprovalData = [{
                    "period": "2014W01",
                    "orgUnit": "ou1",
                    "approvedBy": "approver1",
                    "approvedOn": "2014-01-10T00:00:00.000+0000",
                    "dataSets": ["d1", "d2"],
                    "isApproved": true
                }, {
                    "period": "2014W02",
                    "orgUnit": "ou1",
                    "approvedBy": "approver1",
                    "approvedOn": "2014-01-10T00:00:00.000+0000",
                    "isApproved": true
                }];

                approvalService.getAllLevelTwoApprovalData.and.returnValue(utils.getPromise(q, dhisApprovalData));

                message = {
                    "data": {
                        "type": "downloadData"
                    }
                };

                downloadApprovalConsumer.run(message);
                scope.$apply();

                expect(approvalDataRepository.saveApprovalsFromDhis).toHaveBeenCalledWith(dhisApprovalData);
            });

            it("should merge level one approval data from dhis and idb based on status", function() {
                var dbCompletionWhichIsDeletedInDhis = {
                    "orgUnit": "ou1",
                    "period": "2014W01",
                    "completedBy": "testproj_approver2_l1",
                    "completedOn": "2014-01-10T00:00:00.000+0000",
                    "isComplete": true
                };

                var dbUnchangedCompletion = {
                    "orgUnit": "ou1",
                    "period": "2014W02",
                    "completedBy": "testproj_approver2_l1",
                    "completedOn": "2014-01-10T00:00:00.000+0000",
                    "isComplete": true
                };

                var dbNewCompletion = {
                    "orgUnit": "ou1",
                    "period": "2014W03",
                    "completedBy": "testproj_approver2_l1",
                    "completedOn": "2014-01-10T00:00:00.000+0000",
                    "isComplete": true,
                    "status": "NEW"
                };

                var dbDeletedCompletion = {
                    "orgUnit": "ou1",
                    "period": "2014W04",
                    "completedBy": "testproj_approver2_l1",
                    "completedOn": "2014-01-10T00:00:00.000+0000",
                    "isComplete": true,
                    "status": "DELETED"
                };

                var dbStaleCompletionData = {
                    "orgUnit": "ou1",
                    "period": "2014W06",
                    "completedBy": "testproj_approver2_l1",
                    "completedOn": "2014-01-10T00:00:00.000+0000",
                    "isComplete": true
                };

                var dbApprovedData = {
                    "orgUnit": "ou1",
                    "period": "2014W07",
                    "completedBy": "testproj_approver2_l1",
                    "completedOn": "2014-01-10T00:00:00.000+0000",
                    "approvedBy": "approver2",
                    "approvedOn": "2014-01-11T12:00:00.000+0000",
                    "isComplete": true,
                    "isApproved": true
                };

                var dhisCompletionWithDifferentData = {
                    "orgUnit": dbStaleCompletionData.orgUnit,
                    "period": dbStaleCompletionData.period,
                    "completedBy": "testproj_approver3_l1",
                    "completedOn": "2014-01-11T00:00:00.000+0000"
                };

                var dhisNewCompletion = {
                    "period": "2014W05",
                    "orgUnit": "ou1",
                    "completedBy": "testproj_approver_l1",
                    "completedOn": "2014-01-05T00:00:00.000+0000"
                };

                var dhisCompletionWhichIsDeletedLocally = {
                    "period": dbDeletedCompletion.period,
                    "orgUnit": dbDeletedCompletion.orgUnit,
                    "completedBy": dbDeletedCompletion.completedBy,
                    "completedOn": dbDeletedCompletion.completedOn
                };

                var dhisUnchangedCompletion = {
                    "orgUnit": "ou1",
                    "period": "2014W02",
                    "completedBy": "testproj_approver2_l1",
                    "completedOn": "2014-01-10T00:00:00.000+0000",
                    "isComplete": true
                };

                var dhisCompletionDataForPeriodThatIsApproved = {
                    "orgUnit": "ou1",
                    "period": "2014W07",
                    "completedBy": "testproj_approver2_l1",
                    "completedOn": "2014-01-10T00:00:00.000+0000",
                    "isComplete": true
                };

                var dhisApprovalDataForPeriodThatIsApproved = {
                    "orgUnit": "ou1",
                    "period": "2014W07",
                    "approvedBy": "approver1",
                    "approvedOn": "2014-01-10T00:00:00.000+0000",
                    "isApproved": true
                };

                var dataFromIdb = [dbCompletionWhichIsDeletedInDhis, dbUnchangedCompletion, dbNewCompletion, dbDeletedCompletion, dbStaleCompletionData, dbApprovedData];
                var dataFromDhis = [dhisUnchangedCompletion, dhisCompletionWhichIsDeletedLocally, dhisNewCompletion, dhisCompletionWithDifferentData, dhisCompletionDataForPeriodThatIsApproved];

                approvalService.getAllLevelOneApprovalData.and.returnValue(utils.getPromise(q, dataFromDhis));
                approvalService.getAllLevelTwoApprovalData.and.returnValue(utils.getPromise(q, [dhisApprovalDataForPeriodThatIsApproved]));
                approvalDataRepository.getApprovalDataForPeriodsOrgUnits.and.returnValue(utils.getPromise(q, dataFromIdb));

                message = {
                    "data": {
                        "type": "downloadData"
                    }
                };

                downloadApprovalConsumer.run(message);
                scope.$apply();

                expect(approvalDataRepository.invalidateApproval).toHaveBeenCalledWith(dbCompletionWhichIsDeletedInDhis.period, dbCompletionWhichIsDeletedInDhis.orgUnit);
                expect(approvalDataRepository.invalidateApproval).not.toHaveBeenCalledWith(dbUnchangedCompletion.period, dbUnchangedCompletion.orgUnit);
                expect(approvalDataRepository.invalidateApproval).not.toHaveBeenCalledWith(dbNewCompletion.period, dbNewCompletion.orgUnit);
                expect(approvalDataRepository.invalidateApproval).not.toHaveBeenCalledWith(dbDeletedCompletion.period, dbDeletedCompletion.orgUnit);
                expect(approvalDataRepository.invalidateApproval).not.toHaveBeenCalledWith(dbStaleCompletionData.period, dbStaleCompletionData.orgUnit);
                expect(approvalDataRepository.invalidateApproval).not.toHaveBeenCalledWith(dbApprovedData.period, dbApprovedData.orgUnit);

                expect(approvalDataRepository.saveApprovalsFromDhis).toHaveBeenCalledWith(dhisUnchangedCompletion);
                expect(approvalDataRepository.saveApprovalsFromDhis).not.toHaveBeenCalledWith(dhisCompletionWhichIsDeletedLocally);
                expect(approvalDataRepository.saveApprovalsFromDhis).toHaveBeenCalledWith(dhisCompletionWithDifferentData);
                expect(approvalDataRepository.saveApprovalsFromDhis).not.toHaveBeenCalledWith(dhisCompletionDataForPeriodThatIsApproved);
                expect(approvalDataRepository.saveApprovalsFromDhis).toHaveBeenCalledWith([dhisNewCompletion]);
            });

            it("should merge level two approval data from dhis and idb based on status", function() {
                var dbApprovalWhichIsDeletedInDhis = {
                    "orgUnit": "ou1",
                    "period": "2014W01",
                    "completedBy": "approver1",
                    "completedOn": "2014-01-11T00:00:00.000+0000",
                    "approvedBy": "approver2",
                    "approvedOn": "2014-01-11T12:00:00.000+0000",
                    "isComplete": true,
                    "isApproved": true
                };

                var dbUnchangedApproval = {
                    "period": "2014W02",
                    "orgUnit": "ou1",
                    "completedBy": "approver1",
                    "completedOn": "2014-01-11T00:00:00.000+0000",
                    "approvedBy": "approver1",
                    "approvedOn": "2014-01-10T00:00:00.000+0000",
                    "isComplete": true,
                    "isApproved": true
                };

                var dbNewApproval = {
                    "orgUnit": "ou1",
                    "period": "2014W03",
                    "completedBy": "approver1",
                    "completedOn": "2014-01-11T00:00:00.000+0000",
                    "approvedBy": "approver2",
                    "approvedOn": "2014-01-11T12:00:00.000+0000",
                    "isComplete": true,
                    "isApproved": true,
                    "status": "NEW"
                };

                var dbDeletedApproval = {
                    "orgUnit": "ou1",
                    "period": "2014W04",
                    "isComplete": false,
                    "isApproved": false,
                    "status": "DELETED"
                };

                var dbStaleApprovalData = {
                    "orgUnit": "ou1",
                    "period": "2014W06",
                    "completedBy": "approver1",
                    "completedOn": "2014-01-11T00:00:00.000+0000",
                    "approvedBy": "approver2",
                    "approvedOn": "2014-01-11T12:00:00.000+0000",
                    "isComplete": true,
                    "isApproved": true
                };

                var dbApprovalWhichIsNotApprovedYet = {
                    "orgUnit": "ou1",
                    "period": "2014W07",
                    "isComplete": true,
                    "completedBy": "approver1",
                    "completedOn": "2014-01-11T00:00:00.000+0000",
                    "status": "NEW"
                };

                var dhisApprovalWithDifferentData = {
                    "orgUnit": dbStaleApprovalData.orgUnit,
                    "period": dbStaleApprovalData.period,
                    "isApproved": true,
                    "approvedBy": "newApprover2",
                    "approvedOn": "2014-01-11T14:00:00.000+0000"
                };

                var dhisNewApproval = {
                    "period": "2014W05",
                    "orgUnit": "ou1",
                    "isApproved": true,
                    "approvedBy": "approver1",
                    "approvedOn": "2014-01-10T00:00:00.000+0000",
                };

                var dhisApprovalWhichIsDeletedLocally = {
                    "period": dbDeletedApproval.period,
                    "orgUnit": dbDeletedApproval.orgUnit,
                    "approvedBy": "approver1",
                    "approvedOn": "2014-01-10T00:00:00.000+0000",
                    "isApproved": true
                };

                var dhisUnchangedApproval = {
                    "period": "2014W02",
                    "orgUnit": "ou1",
                    "approvedBy": "approver1",
                    "approvedOn": "2014-01-10T00:00:00.000+0000",
                    "isApproved": true
                };

                var dbApprovalData = [dbApprovalWhichIsDeletedInDhis, dbUnchangedApproval, dbNewApproval, dbDeletedApproval, dbStaleApprovalData, dbApprovalWhichIsNotApprovedYet];
                var dhisApprovalData = [dhisUnchangedApproval, dhisApprovalWhichIsDeletedLocally, dhisApprovalWithDifferentData, dhisNewApproval];

                approvalService.getAllLevelTwoApprovalData.and.returnValue(utils.getPromise(q, dhisApprovalData));
                approvalDataRepository.getApprovalDataForPeriodsOrgUnits.and.returnValue(utils.getPromise(q, dbApprovalData));

                message = {
                    "data": {
                        "type": "downloadData"
                    }
                };

                downloadApprovalConsumer.run(message);
                scope.$apply();

                expect(approvalDataRepository.invalidateApproval).toHaveBeenCalledWith(dbApprovalWhichIsDeletedInDhis.period, dbApprovalWhichIsDeletedInDhis.orgUnit);
                expect(approvalDataRepository.invalidateApproval).not.toHaveBeenCalledWith(dbUnchangedApproval.period, dbUnchangedApproval.orgUnit);
                expect(approvalDataRepository.invalidateApproval).not.toHaveBeenCalledWith(dbNewApproval.period, dbNewApproval.orgUnit);
                expect(approvalDataRepository.invalidateApproval).not.toHaveBeenCalledWith(dbDeletedApproval.period, dbDeletedApproval.orgUnit);
                expect(approvalDataRepository.invalidateApproval).not.toHaveBeenCalledWith(dbStaleApprovalData.period, dbStaleApprovalData.orgUnit);
                expect(approvalDataRepository.invalidateApproval).not.toHaveBeenCalledWith(dbApprovalWhichIsNotApprovedYet.period, dbApprovalWhichIsNotApprovedYet.orgUnit);

                expect(approvalDataRepository.saveApprovalsFromDhis).toHaveBeenCalledWith(dhisUnchangedApproval);
                expect(approvalDataRepository.saveApprovalsFromDhis).not.toHaveBeenCalledWith(dhisApprovalWhichIsDeletedLocally);
                expect(approvalDataRepository.saveApprovalsFromDhis).toHaveBeenCalledWith(dhisApprovalWithDifferentData);
                expect(approvalDataRepository.saveApprovalsFromDhis).toHaveBeenCalledWith([dhisNewApproval]);
            });
        });
    });
