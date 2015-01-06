define(["deleteApprovalConsumer", "angularMocks", "utils", "approvalService"], function(DeleteApprovalConsumer, mocks, utils, ApprovalService) {
    describe("deleteApprovalConsumer", function() {
        var deleteApprovalConsumer, message, approvalService, scope, q;

        beforeEach(mocks.inject(function($rootScope, $q) {
            scope = $rootScope.$new();
            q = $q;

            approvalService = new ApprovalService();
            deleteApprovalConsumer = new DeleteApprovalConsumer(approvalService, q);

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

            spyOn(approvalService, "markAsIncomplete");
            spyOn(approvalService, "markAsUnapproved");
        }));

        it("should delete all approvals from dhis", function() {
            deleteApprovalConsumer.run(message);
            scope.$apply();

            var data = message.data.data;

            expect(approvalService.markAsUnapproved).toHaveBeenCalledWith(data.ds, data.pe, data.ou);
            expect(approvalService.markAsIncomplete).toHaveBeenCalledWith(data.ds, data.pe, data.ou);
        });
    });
});
