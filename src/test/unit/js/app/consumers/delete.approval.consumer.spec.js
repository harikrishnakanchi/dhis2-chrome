define(["deleteApprovalConsumer", "angularMocks", "utils", "approvalService", "approvalDataRepository", "datasetRepository"], function(DeleteApprovalConsumer, mocks, utils, ApprovalService, ApprovalDataRepository, DatasetRepository) {
    describe("deleteApprovalConsumer", function() {
        var deleteApprovalConsumer, message, approvalService, scope, q, completeDataSets, approvedDataSets, allDatasetIds;

        beforeEach(mocks.inject(function($rootScope, $q) {
            scope = $rootScope.$new();
            q = $q;
            allDatasetIds = ["ds1", "ds2"];

            approvalService = new ApprovalService();
            approvalDataRepository = new ApprovalDataRepository();
            datasetRepository = new DatasetRepository();
            deleteApprovalConsumer = new DeleteApprovalConsumer(approvalService, approvalDataRepository, datasetRepository, q);

            message = {
                "data": {
                    "data": {
                        "period": "2014W12",
                        "orgUnit": "org1"
                    },
                    "type": "deleteApprovals"
                }
            };

            spyOn(approvalService, "markAsIncomplete").and.returnValue(utils.getPromise(q, {}));
            spyOn(approvalService, "markAsUnapproved").and.returnValue(utils.getPromise(q, {}));
            spyOn(datasetRepository, "getAllDatasetIds").and.returnValue(utils.getPromise(q, allDatasetIds));

            spyOn(approvalDataRepository, "invalidateApproval").and.returnValue(utils.getPromise(q, undefined));
        }));

        it("should delete approval for all datasets from dhis", function() {

            completeDataSets = {
                "period": "2014W12",
                "orgUnit": "org1",
                "completedBy": "user1",
                "completedOn": "2014-01-01T00:00:00.000Z",
                "approvedBy": "user2",
                "approvedOn": "2014-02-04T00:00:00.000Z",
                "isComplete": true,
                "isApproved": true,
                "status": "DELETED"
            };

            spyOn(approvalDataRepository, "getApprovalData").and.returnValue(utils.getPromise(q, completeDataSets));

            deleteApprovalConsumer.run(message);
            scope.$apply();

            var data = message.data.data;

            expect(approvalService.markAsUnapproved).toHaveBeenCalledWith(allDatasetIds, data.period, data.orgUnit);
            expect(approvalService.markAsIncomplete).toHaveBeenCalledWith(allDatasetIds, data.period, data.orgUnit);
            expect(approvalDataRepository.getApprovalData).toHaveBeenCalledWith({
                "period": data.period,
                "orgUnit": data.orgUnit
            });
            expect(approvalDataRepository.invalidateApproval).toHaveBeenCalledWith(data.period, data.orgUnit);
        });

        it("should delete approval from dhis but not delete from the approval repo if module has been reapproved in the field app", function() {
            completeDataSets = {
                "period": "2014W12",
                "orgUnit": "org1",
                "completedBy": "user1",
                "completedOn": "2014-01-02T00:00:00.000Z",
                "isComplete": true,
                "status": "NEW"
            };

            spyOn(approvalDataRepository, "getApprovalData").and.returnValue(utils.getPromise(q, completeDataSets));

            deleteApprovalConsumer.run(message);
            scope.$apply();

            var data = message.data.data;

            expect(approvalService.markAsUnapproved).toHaveBeenCalledWith(allDatasetIds, data.period, data.orgUnit);
            expect(approvalService.markAsIncomplete).toHaveBeenCalledWith(allDatasetIds, data.period, data.orgUnit);

            expect(approvalDataRepository.invalidateApproval).not.toHaveBeenCalled();
        });
    });
});
