define(["uploadCompletionDataConsumer", "angularMocks", "approvalService", "approvalDataRepository", "utils"],
    function(UploadCompletionDataConsumer, mocks, ApprovalService, ApprovalDataRepository, utils) {
        describe("upload data consumer", function() {
            var approvalDataRepository, uploadCompletionDataConsumer, scope, q;

            beforeEach(mocks.inject(function($q, $rootScope) {
                approvalDataRepository = new ApprovalDataRepository();
                approvalService = new ApprovalService();
                uploadCompletionDataConsumer = new UploadCompletionDataConsumer(approvalService, approvalDataRepository);
                scope = $rootScope.$new();
                q = $q;
            }));


            it("should upload completion data to DHIS", function() {
                spyOn(approvalDataRepository, "getLevelOneApprovalData").and.callFake(function(period, orgUnit) {
                    if (period === "2014W12" && orgUnit === "ou1")
                        return utils.getPromise(q, {
                            "orgUnit": "ou1",
                            "period": "2014W12",
                            "storedBy": "testproj_approver_l1",
                            "date": "2014-05-24T09:00:00.120Z",
                            "dataSets": ["d1", "d2"],
                            "status": "NEW"
                        });

                    return utils.getPromise(q, undefined);
                });
                spyOn(approvalService, "markAsComplete");

                message = {
                    "data": {
                        "data": {
                            dataSets: ["d1", "d2"],
                            period: '2014W12',
                            orgUnit: 'ou1',
                            storedBy: 'testproj_approver_l1',
                            date: "2014-05-24T09:00:00.120Z"
                        },
                        "type": "uploadCompletionData"
                    }
                };

                uploadCompletionDataConsumer.run(message);
                scope.$apply();

                expect(approvalService.markAsComplete).toHaveBeenCalledWith(['d1', 'd2'], '2014W12', 'ou1', 'testproj_approver_l1', '2014-05-24T09:00:00.120Z');
            });

            it("should unapprove data if it has changed", function() {
                spyOn(approvalDataRepository, "getLevelOneApprovalData").and.callFake(function(period, orgUnit) {
                    if (period === "2014W12" && orgUnit === "ou1")
                        return utils.getPromise(q, {
                            "orgUnit": "ou1",
                            "period": "2014W12",
                            "storedBy": "testproj_approver_l1",
                            "date": "2014-05-24T09:00:00.120Z",
                            "status": "DELETED",
                            "dataSets": ["d1", "d2"]
                        });

                    return utils.getPromise(q, undefined);
                });

                spyOn(approvalService, "markAsIncomplete");

                message = {
                    "data": {
                        "data": {
                            "dataSets": ["d1", "d2"],
                            "period": '2014W12',
                            "orgUnit": 'ou1',
                            "status": "DELETED"
                        },
                        "type": "uploadCompletionData"
                    }
                };

                uploadCompletionDataConsumer.run(message);
                scope.$apply();

                expect(approvalService.markAsIncomplete).toHaveBeenCalledWith(['d1', 'd2'], '2014W12', 'ou1');
            });
        });
    });