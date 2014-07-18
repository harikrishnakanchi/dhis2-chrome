define(["uploadApprovalDataConsumer", "angularMocks", "approvalService", "approvalDataRepository", "utils"],
    function(UploadApprovalDataConsumer, mocks, ApprovalService, ApprovalDataRepository, utils) {
        describe("upload data consumer", function() {
            var approvalDataRepository, uploadApprovalDataConsumer, scope, q;

            beforeEach(mocks.inject(function($q, $rootScope) {
                approvalDataRepository = new ApprovalDataRepository();
                approvalService = new ApprovalService();
                uploadApprovalDataConsumer = new UploadApprovalDataConsumer(approvalService, approvalDataRepository);
                scope = $rootScope.$new();
                q = $q;
            }));


            it("should upload approval data to DHIS", function() {
                spyOn(approvalDataRepository, "getLevelTwoApprovalData").and.callFake(function(period, orgUnit) {
                    if (period === "2014W12" && orgUnit === "ou1")
                        return utils.getPromise(q, {
                            "orgUnit": "ou1",
                            "period": "2014W12",
                            "dataSets": ["d1", "d2"]
                        });

                    return utils.getPromise(q, undefined);
                });

                spyOn(approvalService, "markAsApproved");

                message = {
                    "data": {
                        "data": {
                            dataSets: ["d1", "d2"],
                            period: '2014W12',
                            orgUnit: 'ou1'
                        },
                        "type": "uploadApprovalData"
                    }
                };

                uploadApprovalDataConsumer.run(message);
                scope.$apply();

                expect(approvalService.markAsApproved).toHaveBeenCalledWith(['d1', 'd2'], '2014W12', 'ou1');
            });
        });
    });