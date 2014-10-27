define(["approvalDataTransformer"], function(approvalDataTransformer) {
    describe("approval data transformer", function() {

        it("should generate approval data", function() {
            var periodsToApprovePerModule = [{
                "orgUnitId": "123",
                "period": ["2014W32, 2014W33"]
            }, {
                "orgUnitId": "456",
                "period": ["2014W30, 2014W31"]
            }];

            var allDatasets = [{
                "id": "ds1",
                "name": "dataset1",
                "organisationUnits": [{
                    "id": "123",
                    "name": "mod1"
                }, {
                    "id": "456",
                    "name": "mod2"
                }]
            }];

            var expectedApprovalData = [{
                "dataSets": ['ds1'],
                "period": '2014W32, 2014W33',
                "orgUnit": '123',
                "storedBy": 'prj_approver_l1'
            }, {
                "dataSets": ['ds1'],
                "period": '2014W30, 2014W31',
                "orgUnit": '456',
                "storedBy": 'prj_approver_l1'
            }];

            var actualApprovalData = approvalDataTransformer.generateBulkApprovalData(periodsToApprovePerModule, allDatasets, "prj_approver_l1");

            expect(actualApprovalData).toEqual(expectedApprovalData);
        });
    });
});