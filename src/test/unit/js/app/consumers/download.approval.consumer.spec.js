define(["downloadApprovalConsumer", "angularMocks", "properties", "utils", "datasetRepository", "orgUnitRepository", "userPreferenceRepository", "approvalService", "moment"],
    function(DownloadApprovalConsumer, mocks, properties, utils, DatasetRepository, OrgUnitRepository, UserPreferenceRepository, ApprovalService, moment) {
        describe("download approval consumer", function() {

            var approvalDataRepository, datasetRepository, userPreferenceRepository, orgUnitRepository, q, scope, downloadApprovalConsumer, message, approvalService;

            beforeEach(mocks.inject(function($q, $rootScope) {
                q = $q;
                scope = $rootScope.$new();

                userPreferenceRepository = {
                    "getUserModules": jasmine.createSpy("getUserModules").and.returnValue(utils.getPromise(q, ["org_0"]))
                };

                datasetRepository = {
                    "getAll": jasmine.createSpy("getAll").and.returnValue(utils.getPromise(q, [{
                        "id": "DS_OPD"
                    }])),
                    "findAllForOrgUnits": jasmine.createSpy("findAllForOrgUnits").and.returnValue(utils.getPromise(q, [{
                        "id": "DS_OPD"
                    }]))
                };

                approvalDataRepository = {
                    "getApprovalDataForPeriodsOrgUnits": jasmine.createSpy("getApprovalDataForPeriodsOrgUnits").and.returnValue(utils.getPromise(q, [])),
                    "saveApprovalsFromDhis": jasmine.createSpy("saveApprovalsFromDhis"),
                    "invalidateApproval": jasmine.createSpy("invalidateApproval")
                };

                approvalService = {
                    "getCompletionData": jasmine.createSpy("getCompletionData").and.returnValue(utils.getPromise(q, [])),
                    "getApprovalData": jasmine.createSpy("getApprovalData").and.returnValue(utils.getPromise(q, []))
                };

                orgUnitRepository = new OrgUnitRepository();
                spyOn(orgUnitRepository, "findAllByParent").and.returnValue(utils.getPromise(q, []));

                downloadApprovalConsumer = new DownloadApprovalConsumer(datasetRepository, userPreferenceRepository, orgUnitRepository, q, approvalService, approvalDataRepository);
            }));

            it("should download approval data from dhis based on user module ids and dataset", function() {
                userPreferenceRepository.getUserModules.and.returnValue(utils.getPromise(q, [{
                    "name": "mod1",
                    "id": "mod1"
                }, {
                    "name": "mod2",
                    "id": "mod2"
                }, {
                    "name": "mod3",
                    "id": "mod3"
                }]));

                var originOrgUnits = [{
                    "id": "org1"
                }];

                orgUnitRepository.findAllByParent.and.returnValue(utils.getPromise(q, originOrgUnits));

                message = {
                    "data": {
                        "type": "downloadData"
                    }
                };

                downloadApprovalConsumer.run(message);
                scope.$apply();

                expect(userPreferenceRepository.getUserModules).toHaveBeenCalled();
                expect(datasetRepository.getAll).toHaveBeenCalled();

                expect(approvalService.getCompletionData).toHaveBeenCalledWith(["mod1", "mod2", "mod3"], originOrgUnits, ["DS_OPD"]);
                expect(approvalService.getApprovalData).toHaveBeenCalledWith("mod1", ["DS_OPD"]);
                expect(approvalService.getApprovalData).toHaveBeenCalledWith("mod2", ["DS_OPD"]);
                expect(approvalService.getApprovalData).toHaveBeenCalledWith("mod3", ["DS_OPD"]);
            });

            it("should not download approval data from dhis if the user does not have any preferred moduleids", function() {
                userPreferenceRepository.getUserModules.and.returnValue(utils.getPromise(q, []));

                datasetRepository.getAll.and.returnValue(utils.getPromise(q, ["ds1"]));

                message = {
                    "data": {
                        "type": "downloadData"
                    }
                };

                downloadApprovalConsumer.run(message);
                scope.$apply();

                expect(approvalService.getCompletionData).not.toHaveBeenCalled();
                expect(approvalService.getApprovalData).not.toHaveBeenCalled();
            });

            it("should save downloaded dhis completion data to idb if completion data doesn't exist in idb", function() {
                var dhisCompletionData = [{
                    "period": "2014W01",
                    "orgUnit": "ou1",
                    "completedBy": "testproj_approver_l1",
                    "completedOn": "2014-01-05T00:00:00.000+0000",
                    "isComplete": true
                }, {
                    "period": "2014W02",
                    "orgUnit": "ou1",
                    "completedBy": "testproj_approver_l1",
                    "completedOn": "2014-01-05T00:00:00.000+0000",
                    "isComplete": true
                }];

                approvalService.getCompletionData.and.returnValue(utils.getPromise(q, dhisCompletionData));

                message = {
                    "data": {
                        "type": "downloadData"
                    }
                };

                downloadApprovalConsumer.run(message);
                scope.$apply();

                expect(approvalDataRepository.saveApprovalsFromDhis).toHaveBeenCalledWith(dhisCompletionData);
            });

            it("should save downloaded dhis approval data to idb if approval data doesn't exist in idb", function() {
                var dhisCompletionData = [{
                    "period": "2014W01",
                    "orgUnit": "ou1",
                    "completedBy": "testproj_approver_l1",
                    "completedOn": "2014-01-05T00:00:00.000+0000",
                    "isComplete": true
                }, {
                    "period": "2014W02",
                    "orgUnit": "ou1",
                    "completedBy": "testproj_approver_l1",
                    "completedOn": "2014-01-05T00:00:00.000+0000",
                    "isComplete": true
                }];

                var dhisApprovalData = [{
                    "period": "2014W01",
                    "orgUnit": "ou1",
                    "approvedBy": "approver1",
                    "approvedOn": "2014-01-10T00:00:00.000+0000",
                    "isApproved": true
                }, {
                    "period": "2014W02",
                    "orgUnit": "ou1",
                    "approvedBy": "approver1",
                    "approvedOn": "2014-01-10T00:00:00.000+0000",
                    "isApproved": true
                }];

                approvalService.getCompletionData.and.returnValue(utils.getPromise(q, dhisCompletionData));
                approvalService.getApprovalData.and.returnValue(utils.getPromise(q, dhisApprovalData));

                message = {
                    "data": {
                        "type": "downloadData"
                    }
                };

                downloadApprovalConsumer.run(message);
                scope.$apply();

                var expectedApprovalData = [{
                    "period": "2014W01",
                    "orgUnit": "ou1",
                    "completedBy": "testproj_approver_l1",
                    "completedOn": "2014-01-05T00:00:00.000+0000",
                    "approvedBy": "approver1",
                    "approvedOn": "2014-01-10T00:00:00.000+0000",
                    "isComplete": true,
                    "isApproved": true
                }, {
                    "period": "2014W02",
                    "orgUnit": "ou1",
                    "completedBy": "testproj_approver_l1",
                    "completedOn": "2014-01-05T00:00:00.000+0000",
                    "approvedBy": "approver1",
                    "approvedOn": "2014-01-10T00:00:00.000+0000",
                    "isComplete": true,
                    "isApproved": true
                }];

                expect(approvalDataRepository.saveApprovalsFromDhis).toHaveBeenCalledWith(expectedApprovalData);
            });

            it("should overwrite completion data if it exists in both dhis and idb", function() {
                var unchangedCompletion = {
                    "orgUnit": "ou1",
                    "period": "2014W01",
                    "completedBy": "testproj_approver2_l1",
                    "completedOn": "2014-01-10T00:00:00.000+0000",
                    "isComplete": true
                };

                var oldCompletion = {
                    "orgUnit": "ou2",
                    "period": "2014W02",
                    "completedBy": "testproj_approver2_l1",
                    "completedOn": "2014-01-10T00:00:00.000+0000",
                    "isComplete": true
                };

                var updatedCompletion = {
                    "orgUnit": "ou2",
                    "period": "2014W02",
                    "completedBy": "new_testproj_approver2_l1",
                    "completedOn": "2014-02-10T00:00:00.000+0000",
                    "isComplete": true
                };

                approvalService.getCompletionData.and.returnValue(utils.getPromise(q, [unchangedCompletion, updatedCompletion]));
                approvalDataRepository.getApprovalDataForPeriodsOrgUnits.and.returnValue(utils.getPromise(q, [unchangedCompletion, oldCompletion]));

                message = {
                    "data": {
                        "type": "downloadData"
                    }
                };

                downloadApprovalConsumer.run(message);
                scope.$apply();

                expect(approvalDataRepository.invalidateApproval).not.toHaveBeenCalled();
                expect(approvalDataRepository.saveApprovalsFromDhis.calls.count()).toEqual(2);
                expect(approvalDataRepository.saveApprovalsFromDhis).toHaveBeenCalledWith(unchangedCompletion);
                expect(approvalDataRepository.saveApprovalsFromDhis).toHaveBeenCalledWith(updatedCompletion);
            });

            it("should overwrite approval data if it exists in both dhis and idb", function() {
                var unchangedApproval = {
                    "orgUnit": "ou1",
                    "period": "2014W01",
                    "completedBy": "testproj_approver1_l1",
                    "completedOn": "2014-01-10T00:00:00.000+0000",
                    "approvedBy": "testproj_approver1_l2",
                    "approvedOn": "2014-01-11T00:00:00.000+0000",
                    "isComplete": true,
                    "isApproved": true
                };

                var dhisCompletionForUnchangedApproval = _.omit(unchangedApproval, ["approvedBy", "approvedOn", "isApproved"]);
                var dhisApprovalForUnchangedApproval = _.omit(unchangedApproval, ["completedBy", "completedOn", "isComplete"]);

                var oldApproval = {
                    "orgUnit": "ou2",
                    "period": "2014W02",
                    "completedBy": "testproj_approver1_l1",
                    "completedOn": "2014-01-10T00:00:00.000+0000",
                    "approvedBy": "testproj_approver1_l2",
                    "approvedOn": "2014-01-11T00:00:00.000+0000",
                    "isComplete": true,
                    "isApproved": true
                };

                var updatedApproval = {
                    "orgUnit": "ou2",
                    "period": "2014W02",
                    "completedBy": "testproj_approver1_l1",
                    "completedOn": "2014-01-10T00:00:00.000+0000",
                    "approvedBy": "testproj_approver1_l2",
                    "approvedOn": "2014-01-11T00:00:00.000+0000",
                    "isComplete": true,
                    "isApproved": true
                };

                var dhisCompletionForUpdatedApproval = _.omit(updatedApproval, ["approvedBy", "approvedOn", "isApproved"]);
                var dhisApprovalForUpdatedApproval = _.omit(updatedApproval, ["completedBy", "completedOn", "isComplete"]);

                approvalService.getCompletionData.and.returnValue(utils.getPromise(q, [dhisCompletionForUnchangedApproval, dhisCompletionForUpdatedApproval]));
                approvalService.getApprovalData.and.returnValue(utils.getPromise(q, [dhisApprovalForUnchangedApproval, dhisApprovalForUpdatedApproval]));
                approvalDataRepository.getApprovalDataForPeriodsOrgUnits.and.returnValue(utils.getPromise(q, [unchangedApproval, oldApproval]));

                message = {
                    "data": {
                        "type": "downloadData"
                    }
                };

                downloadApprovalConsumer.run(message);
                scope.$apply();

                expect(approvalDataRepository.invalidateApproval).not.toHaveBeenCalled();
                expect(approvalDataRepository.saveApprovalsFromDhis.calls.count()).toEqual(2);
                expect(approvalDataRepository.saveApprovalsFromDhis).toHaveBeenCalledWith(unchangedApproval);
                expect(approvalDataRepository.saveApprovalsFromDhis).toHaveBeenCalledWith(updatedApproval);
            });

            it("should delete completion and approval data that is not present in dhis", function() {
                var dbCompletionWhichIsDeletedInDhis = {
                    "orgUnit": "ou1",
                    "period": "2014W01",
                    "completedBy": "testproj_approver2_l1",
                    "completedOn": "2014-01-10T00:00:00.000+0000",
                    "isComplete": true
                };

                var dbApprovalWhichIsDeletedInDhis = {
                    "orgUnit": "ou2",
                    "period": "2014W02",
                    "completedBy": "approver1",
                    "completedOn": "2014-01-11T00:00:00.000+0000",
                    "approvedBy": "approver2",
                    "approvedOn": "2014-01-11T12:00:00.000+0000",
                    "isComplete": true,
                    "isApproved": true
                };

                approvalService.getCompletionData.and.returnValue(utils.getPromise(q, []));
                approvalService.getApprovalData.and.returnValue(utils.getPromise(q, []));
                approvalDataRepository.getApprovalDataForPeriodsOrgUnits.and.returnValue(utils.getPromise(q, [dbCompletionWhichIsDeletedInDhis, dbApprovalWhichIsDeletedInDhis]));

                message = {
                    "data": {
                        "type": "downloadData"
                    }
                };

                downloadApprovalConsumer.run(message);
                scope.$apply();

                expect(approvalDataRepository.invalidateApproval.calls.count()).toEqual(2);
                expect(approvalDataRepository.invalidateApproval).toHaveBeenCalledWith(dbCompletionWhichIsDeletedInDhis.period, dbCompletionWhichIsDeletedInDhis.orgUnit);
                expect(approvalDataRepository.invalidateApproval).toHaveBeenCalledWith(dbApprovalWhichIsDeletedInDhis.period, dbApprovalWhichIsDeletedInDhis.orgUnit);
            });

            it("should not change completion data that is new locally or deleted locally", function() {

                var newCompletionInDb = {
                    "orgUnit": "ou1",
                    "period": "2014W03",
                    "completedBy": "testproj_approver2_l1",
                    "completedOn": "2014-01-10T00:00:00.000+0000",
                    "isComplete": true,
                    "status": "NEW"
                };

                var locallyDeletedCompletion = {
                    "orgUnit": "ou1",
                    "period": "2014W04",
                    "completedBy": "testproj_approver2_l1",
                    "completedOn": "2014-01-10T00:00:00.000+0000",
                    "isComplete": true,
                    "status": "DELETED"
                };

                var dhisCompletionWhichIsDeletedLocally = _.omit(locallyDeletedCompletion, "status");

                approvalService.getCompletionData.and.returnValue(utils.getPromise(q, [dhisCompletionWhichIsDeletedLocally]));
                approvalDataRepository.getApprovalDataForPeriodsOrgUnits.and.returnValue(utils.getPromise(q, [newCompletionInDb, locallyDeletedCompletion]));

                message = {
                    "data": {
                        "type": "downloadData"
                    }
                };

                downloadApprovalConsumer.run(message);
                scope.$apply();

                expect(approvalDataRepository.saveApprovalsFromDhis).not.toHaveBeenCalled();
            });

            it("should merge level two approval data from dhis and idb based on status", function() {

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

                var dhisCompletionDataForNewApproval = _.omit(dbNewApproval, ["approvedOn", "approvedBy", "isApproved", "status"]);

                var dhisCompletionDataForApprovalWhichIsDeletedLocally = {
                    "period": dbDeletedApproval.period,
                    "orgUnit": dbDeletedApproval.orgUnit,
                    "completedBy": "approver1",
                    "completedOn": "2014-01-10T00:00:00.000+0000",
                    "isComplete": true
                };

                var dhisApprovalWhichIsDeletedLocally = {
                    "period": dbDeletedApproval.period,
                    "orgUnit": dbDeletedApproval.orgUnit,
                    "approvedBy": "approver2",
                    "approvedOn": "2014-01-11T00:00:00.000+0000",
                    "isApproved": true
                };

                var dbApprovalData = [dbNewApproval, dbDeletedApproval];
                var dhisCompletionData = [dhisCompletionDataForNewApproval, dhisCompletionDataForApprovalWhichIsDeletedLocally];
                var dhisApprovalData = [dhisApprovalWhichIsDeletedLocally];

                approvalService.getCompletionData.and.returnValue(utils.getPromise(q, dhisCompletionData));
                approvalService.getApprovalData.and.returnValue(utils.getPromise(q, dhisApprovalData));
                approvalDataRepository.getApprovalDataForPeriodsOrgUnits.and.returnValue(utils.getPromise(q, dbApprovalData));

                message = {
                    "data": {
                        "type": "downloadData"
                    }
                };

                downloadApprovalConsumer.run(message);
                scope.$apply();

                expect(approvalDataRepository.saveApprovalsFromDhis).not.toHaveBeenCalled();
            });
        });
    });
