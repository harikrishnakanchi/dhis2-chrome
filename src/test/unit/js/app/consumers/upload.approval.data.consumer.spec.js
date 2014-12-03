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
                            "dataSets": ["d1", "d2"],
                            "isApproved": true,
                            "isAccepted": false,
                            "status": "NEW",
                            "createdByUsername": "foobar",
                            "createdDate": "2014-01-01"
                        });

                    return utils.getPromise(q, undefined);
                });

                spyOn(approvalDataRepository, "saveLevelTwoApproval");
                spyOn(approvalService, "markAsApproved").and.returnValue(utils.getPromise(q, {}));

                var approvalData = {
                    dataSets: ["d1", "d2"],
                    period: '2014W12',
                    orgUnit: 'ou1',
                    status: "NEW",
                    isApproved: true,
                    isAccepted: false,
                    createdByUsername: "foobar",
                    createdDate: "2014-01-01"
                };

                var message = {
                    "data": {
                        "data": approvalData,
                        "type": "uploadApprovalData",
                    }
                };

                uploadApprovalDataConsumer.run(message);
                scope.$apply();

                expect(approvalService.markAsApproved).toHaveBeenCalledWith(['d1', 'd2'], '2014W12', 'ou1', "foobar", "2014-01-01");
                expect(approvalDataRepository.saveLevelTwoApproval).toHaveBeenCalledWith(_.omit(approvalData, "status"));
            });

            it("should unapprove data", function() {
                spyOn(approvalDataRepository, "getLevelTwoApprovalData").and.callFake(function(period, orgUnit) {
                    if (period === "2014W12" && orgUnit === "ou1")
                        return utils.getPromise(q, {
                            "orgUnit": "ou1",
                            "period": "2014W12",
                            "status": "DELETED",
                            "createdByUsername": "foobar",
                            "createdDate": "2014-01-01",
                            "dataSets": ["d1", "d2"]
                        });

                    return utils.getPromise(q, undefined);
                });

                spyOn(approvalDataRepository, "deleteLevelTwoApproval");
                spyOn(approvalService, "markAsUnapproved").and.returnValue(utils.getPromise(q, {}));

                var approvalData = {
                    dataSets: ["d1", "d2"],
                    period: '2014W12',
                    orgUnit: 'ou1',
                    status: "DELETED",
                    createdByUsername: "foobar",
                    createdDate: "2014-01-01"
                };

                var message = {
                    "data": {
                        "data": approvalData,
                        "type": "uploadCompletionData"
                    }
                };

                uploadApprovalDataConsumer.run(message);
                scope.$apply();

                expect(approvalService.markAsUnapproved).toHaveBeenCalledWith(['d1', 'd2'], '2014W12', 'ou1');
                expect(approvalDataRepository.deleteLevelTwoApproval).toHaveBeenCalledWith('2014W12', 'ou1');
            });
        });
    });