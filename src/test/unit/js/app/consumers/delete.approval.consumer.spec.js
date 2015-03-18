define(["deleteApprovalConsumer", "angularMocks", "utils", "approvalService", "approvalDataRepository"], function(DeleteApprovalConsumer, mocks, utils, ApprovalService, ApprovalDataRepository) {
    describe("deleteApprovalConsumer", function() {
        var deleteApprovalConsumer, message, approvalService, scope, q, completeDataSets, approvedDataSets;

        beforeEach(mocks.inject(function($rootScope, $q) {
            scope = $rootScope.$new();
            q = $q;

            approvalService = new ApprovalService();
            approvalDataRepository = new ApprovalDataRepository();
            deleteApprovalConsumer = new DeleteApprovalConsumer(approvalService, approvalDataRepository, q);

            message = {
                "data": {
                    "data": {
                        "ds": ["ds1", "ds2"],
                        "pe": "2014W12",
                        "ou": "org1"
                    },
                    "type": "upsertOrgUnit"
                }
            };

            spyOn(approvalService, "markAsIncomplete").and.returnValue(utils.getPromise(q, {}));
            spyOn(approvalService, "markAsUnapproved").and.returnValue(utils.getPromise(q, {}));

            completeDataSets = {
                "orgUnit": "org1",
                "period": "2014W12",
                "status": "DELETED",
                "createdByUsername": "foobar",
                "createdDate": "2014-01-01",
                "dataSets": ["ds1", "ds2"]
            };
            spyOn(approvalDataRepository, "getLevelOneApprovalData").and.returnValue(utils.getPromise(q, completeDataSets));

            approvedDataSets = {
                "isApproved": true,
                "isAccepted": true,
                "orgUnit": "org1",
                "period": "2014W12",
                "status": "DELETED",
            };
            spyOn(approvalDataRepository, "getLevelTwoApprovalData").and.returnValue(utils.getPromise(q, approvedDataSets));
            spyOn(approvalDataRepository, "saveLevelOneApproval");
            spyOn(approvalDataRepository, "saveLevelTwoApproval");

        }));

        it("should delete all approvals from dhis", function() {
            deleteApprovalConsumer.run(message);
            scope.$apply();

            var data = message.data.data;

            expect(approvalService.markAsUnapproved).toHaveBeenCalledWith(data.ds, data.pe, data.ou);
            expect(approvalService.markAsIncomplete).toHaveBeenCalledWith(data.ds, data.pe, data.ou);

            var expectedPayload = {
                "orgUnit": "org1",
                "period": "2014W12",
                "createdByUsername": "foobar",
                "createdDate": "2014-01-01",
                "dataSets": ["ds1", "ds2"]
            };

            expect(approvalDataRepository.saveLevelOneApproval).toHaveBeenCalledWith(_.omit(completeDataSets, 'status'));
            expect(approvalDataRepository.saveLevelTwoApproval).toHaveBeenCalledWith(_.omit(approvedDataSets, 'status'));
        });
    });
});
