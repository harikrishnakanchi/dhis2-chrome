define(["uploadApprovalDataConsumer", "angularMocks", "approvalService", "approvalDataRepository", "utils"],
    function(UploadApprovalDataConsumer, mocks, ApprovalService, ApprovalDataRepository, utils) {
        xdescribe("upload data consumer", function() {
            var approvalDataRepository, uploadApprovalDataConsumer, scope, q;

            beforeEach(mocks.inject(function($q, $rootScope) {
                approvalDataRepository = new ApprovalDataRepository();
                approvalService = new ApprovalService();
                uploadApprovalDataConsumer = new UploadApprovalDataConsumer(approvalService, approvalDataRepository);
                scope = $rootScope.$new();
                q = $q;
            }));


            it("should upload approval data to DHIS", function() {
                var approvalData = {
                    "orgUnit": "ou1",
                    "period": "2014W12",
                    "dataSets": ["d1", "d2"],
                    "isApproved": true,
                    "status": "NEW",
                    "createdByUsername": "foobar",
                    "createdDate": "2014-01-01"
                };

                spyOn(approvalDataRepository, "getLevelTwoApprovalData").and.returnValue(utils.getPromise(q, approvalData));
                spyOn(approvalService, "markAsApproved").and.returnValue(utils.getPromise(q, {}));

                var message = {
                    "data": {
                        "data": {
                            "period": "2014W12",
                            "orgUnit": "ou1"
                        },
                        "type": "uploadApprovalData",
                    }
                };

                uploadApprovalDataConsumer.run(message);
                scope.$apply();

                expect(approvalDataRepository.getLevelTwoApprovalData).toHaveBeenCalledWith("2014W12", "ou1");
                expect(approvalService.markAsApproved).toHaveBeenCalledWith(['d1', 'd2'], '2014W12', 'ou1', "foobar", "2014-01-01");
            });

            it("should upload accept data to DHIS", function() {
                var approvalData = {
                    "orgUnit": "ou1",
                    "period": "2014W12",
                    "dataSets": ["d1", "d2"],
                    "isApproved": true,
                    "status": "NEW",
                    "createdByUsername": "foobar",
                    "createdDate": "2014-01-01"
                };

                spyOn(approvalDataRepository, "getLevelTwoApprovalData").and.returnValue(utils.getPromise(q, approvalData));
                spyOn(approvalService, "markAsApproved").and.returnValue(utils.getPromise(q, {}));

                var message = {
                    "data": {
                        "data": {
                            "period": "2014W12",
                            "orgUnit": "ou1"
                        },
                        "type": "uploadApprovalData",
                    }
                };

                uploadApprovalDataConsumer.run(message);
                scope.$apply();

                expect(approvalDataRepository.getLevelTwoApprovalData).toHaveBeenCalledWith("2014W12", "ou1");
                expect(approvalService.markAsApproved).toHaveBeenCalledWith(['d1', 'd2'], '2014W12', 'ou1', "foobar", "2014-01-01");
            });
        });
    });
