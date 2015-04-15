define(["uploadCompletionDataConsumer", "angularMocks", "approvalService", "approvalDataRepository", "datasetRepository", "utils"],
    function(UploadCompletionDataConsumer, mocks, ApprovalService, ApprovalDataRepository, DatasetRepository, utils) {
        describe("upload data consumer", function() {
            var approvalDataRepository, uploadCompletionDataConsumer, datasetRepository, scope, q;

            beforeEach(mocks.inject(function($q, $rootScope) {

                scope = $rootScope.$new();
                q = $q;

                approvalDataRepository = new ApprovalDataRepository();
                spyOn(approvalDataRepository, "clearStatusFlag").and.returnValue(utils.getPromise(q, {}));

                approvalService = new ApprovalService();
                spyOn(approvalService, "markAsComplete").and.returnValue(utils.getPromise(q, {}));

                datasetRepository = new DatasetRepository();

                uploadCompletionDataConsumer = new UploadCompletionDataConsumer(approvalService, approvalDataRepository, datasetRepository, q);
            }));


            it("should upload completion data to DHIS", function() {

                var allDatasetIds = ['d1', 'd2'];

                var approvalData = [{
                    "period": "2014W01",
                    "orgUnit": "ou1",
                    "completedBy": "user1",
                    "completedOn": "2014-01-05T00:00:00.000+0000",
                    "approvedBy": "approver1",
                    "approvedOn": "2014-01-10T00:00:00.000+0000",
                    "isComplete": true,
                    "isApproved": true,
                    "status": "NEW"
                }];

                spyOn(datasetRepository, "getAll").and.returnValue(utils.getPromise(q, [{
                    'id': allDatasetIds[0]
                }, {
                    'id': allDatasetIds[1]
                }]));
                spyOn(approvalDataRepository, "getApprovalData").and.returnValue(utils.getPromise(q, approvalData));

                message = {
                    "data": {
                        "data": [{
                            "period": "2014W01",
                            "orgUnit": "ou1"
                        }, {
                            "period": "2014W01",
                            "orgUnit": "ou2"
                        }],
                        "type": "uploadCompletionData"
                    }
                };

                uploadCompletionDataConsumer.run(message);
                scope.$apply();

                var expectedPeriodsAndOrgUnitsToUpsert = [{
                    "period": "2014W01",
                    "orgUnit": "ou1"
                }];

                expect(approvalService.markAsComplete).toHaveBeenCalledWith(allDatasetIds, expectedPeriodsAndOrgUnitsToUpsert, "user1", "2014-01-05T00:00:00.000+0000");
            });

            it("should clear status flag for only those approvals that are complete", function() {
                var approval = {
                    "period": "2014W01",
                    "orgUnit": "ou1",
                    "completedBy": "user1",
                    "completedOn": "2014-01-05T00:00:00.000+0000",
                    "approvedBy": "approver1",
                    "approvedOn": "2014-01-10T00:00:00.000+0000",
                    "isComplete": true,
                    "isApproved": true,
                    "status": "NEW"
                };

                var approvalThatIsMarkedAsCompleteOnly = {
                    "period": "2014W01",
                    "orgUnit": "ou2",
                    "completedBy": "user1",
                    "completedOn": "2014-01-05T00:00:00.000+0000",
                    "approvedBy": "approver1",
                    "approvedOn": "2014-01-10T00:00:00.000+0000",
                    "isComplete": true,
                    "isApproved": false,
                    "status": "NEW"
                };

                var approvalData = [approval, approvalThatIsMarkedAsCompleteOnly];

                spyOn(datasetRepository, "getAll").and.returnValue(utils.getPromise(q, [{
                    'id': 'd1'
                }, {
                    'id': 'd2'
                }]));
                spyOn(approvalDataRepository, "getApprovalData").and.returnValue(utils.getPromise(q, approvalData));

                message = {
                    "data": {
                        "data": [{
                            "period": "2014W01",
                            "orgUnit": "ou1"
                        }, {
                            "period": "2014W01",
                            "orgUnit": "ou2"
                        }, {
                            "period": "2014W02",
                            "orgUnit": "ou1"
                        }],
                        "type": "uploadCompletionData"
                    }
                };

                uploadCompletionDataConsumer.run(message);
                scope.$apply();

                expect(approvalDataRepository.clearStatusFlag).not.toHaveBeenCalledWith(approval.period, approval.orgUnit);
                expect(approvalDataRepository.clearStatusFlag).toHaveBeenCalledWith(approvalThatIsMarkedAsCompleteOnly.period, approvalThatIsMarkedAsCompleteOnly.orgUnit);
            });
        });
    });
