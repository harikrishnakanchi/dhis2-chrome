define(["uploadApprovalDataConsumer", "angularMocks", "approvalService", "approvalDataRepository", "dataSetRepository", "utils"],
    function(UploadApprovalDataConsumer, mocks, ApprovalService, ApprovalDataRepository, DatasetRepository, utils) {
        describe("upload data consumer", function() {
            var approvalDataRepository, uploadApprovalDataConsumer, datasetRepository, scope, q;

            beforeEach(mocks.inject(function($q, $rootScope) {
                scope = $rootScope.$new();
                q = $q;

                approvalDataRepository = new ApprovalDataRepository();
                spyOn(approvalDataRepository, "clearStatusFlag").and.returnValue(utils.getPromise(q, {}));

                approvalService = new ApprovalService();
                spyOn(approvalService, "markAsApproved").and.returnValue(utils.getPromise(q, {}));

                datasetRepository = new DatasetRepository();

                uploadApprovalDataConsumer = new UploadApprovalDataConsumer(approvalService, approvalDataRepository, datasetRepository, q);
            }));


            it("should upload approval data to DHIS", function() {

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
                    'id': 'd1'
                }, {
                    'id': 'd2'
                }]));

                spyOn(approvalDataRepository, "getApprovalData").and.returnValue(utils.getPromise(q, approvalData));

                var message = {
                    "data": {
                        "data": {
                            "period": "2014W01",
                            "orgUnit": "ou1"
                        },
                        "type": "uploadApprovalData",
                    }
                };

                uploadApprovalDataConsumer.run(message);
                scope.$apply();

                var expectedPeriodsAndOrgUnitsToUpsert = [{
                    "period": "2014W01",
                    "orgUnit": "ou1"
                }];

                expect(approvalService.markAsApproved).toHaveBeenCalledWith(allDatasetIds, expectedPeriodsAndOrgUnitsToUpsert, "approver1", "2014-01-10T00:00:00.000+0000");
            });

            it("should clear the status flag upon successful approval", function() {
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
                    'id': 'd1'
                }, {
                    'id': 'd2'
                }]));
                spyOn(approvalDataRepository, "getApprovalData").and.returnValue(utils.getPromise(q, approvalData));

                var message = {
                    "data": {
                        "data": {
                            "period": "2014W01",
                            "orgUnit": "ou1"
                        },
                        "type": "uploadApprovalData",
                    }
                };

                uploadApprovalDataConsumer.run(message);
                scope.$apply();

                expect(approvalDataRepository.clearStatusFlag).toHaveBeenCalledWith("2014W01", "ou1");
            });
        });
    });
