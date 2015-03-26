define(["uploadCompletionDataConsumer", "angularMocks", "approvalService", "approvalDataRepository", "utils"],
    function(UploadCompletionDataConsumer, mocks, ApprovalService, ApprovalDataRepository, utils) {
        xdescribe("upload data consumer", function() {
            var approvalDataRepository, uploadCompletionDataConsumer, scope, q;

            beforeEach(mocks.inject(function($q, $rootScope) {
                approvalDataRepository = new ApprovalDataRepository();
                approvalService = new ApprovalService();
                uploadCompletionDataConsumer = new UploadCompletionDataConsumer(approvalService, approvalDataRepository);
                scope = $rootScope.$new();
                q = $q;
            }));


            it("should upload completion data to DHIS", function() {

                var approvalData = [{
                    "period": "2014W01",
                    "orgUnit": "ou1",
                    "completedBy": "user1",
                    "completedOn": "2014-01-05T00:00:00.000+0000",
                    "approvedBy": "approver1",
                    "approvedOn": "2014-01-10T00:00:00.000+0000",
                    "isComplete": true,
                    "isApproved": true
                }, {
                    "period": "2014W01",
                    "orgUnit": "ou2",
                    "completedBy": "user1",
                    "completedOn": "2014-01-05T00:00:00.000+0000",
                    "approvedBy": "approver1",
                    "approvedOn": "2014-01-10T00:00:00.000+0000",
                    "isComplete": true,
                    "isApproved": false
                }, undefined];

                spyOn(approvalDataRepository, "getApprovalData").and.returnValue(utils.getPromise(q, approvalData));

                spyOn(approvalService, "markAsComplete").and.returnValue(utils.getPromise(q, {}));

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

                expect(approvalService.markAsComplete).toHaveBeenCalledWith(['d1', 'd2'], '2014W12', 'ou1', 'testproj_approver_l1', '2014-05-24T09:00:00.120Z');
            });
        });
    });
