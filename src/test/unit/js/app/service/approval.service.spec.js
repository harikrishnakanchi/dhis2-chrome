define(["approvalService", "angularMocks", "properties", "utils"], function(ApprovalService, mocks, properties, utils) {
    describe("dataService", function() {
        var http, httpBackend, db, approvalStore;

        beforeEach(mocks.inject(function($injector) {
            http = $injector.get('$http');

            httpBackend = $injector.get('$httpBackend');

            approvalStore = {
                "upsert": jasmine.createSpy(),
            };

            db = {
                objectStore: function() {},
            };

            spyOn(db, "objectStore").and.returnValue(approvalStore);
        }));

        afterEach(function() {
            httpBackend.verifyNoOutstandingExpectation();
            httpBackend.verifyNoOutstandingRequest();
        });

        it("should save approval in dhis and in db", function() {
            var approvalRequests = [{
                "dataSet": "170b8cd5e53",
                "period": "2014W20",
                "orgUnit": "c484c99b86d"
            }, {
                "dataSet": "b6203b33069",
                "period": "2014W20",
                "orgUnit": "c484c99b86d"
            }];

            var expectedApprovalState = [{
                "dataSet": "170b8cd5e53",
                "period": "2014W20",
                "orgUnit": "c484c99b86d",
                "isApproved": true,
            }, {
                "dataSet": "b6203b33069",
                "period": "2014W20",
                "orgUnit": "c484c99b86d",
                "isApproved": true,
            }];
            httpBackend.expectPOST(properties.dhis.url + "/api/dataApprovals/bulk", approvalRequests).respond(200, "ok");

            var approvalService = new ApprovalService(http, db);
            approvalService.approve(approvalRequests);
            httpBackend.flush();

            expect(db.objectStore).toHaveBeenCalledWith("approvals");
            expect(approvalStore.upsert).toHaveBeenCalledWith(expectedApprovalState);
        });

        it("should save approval in db even if save to dhis fails", function() {
            var approvalRequests = [{
                "dataSet": "170b8cd5e53",
                "period": "2014W20",
                "orgUnit": "c484c99b86d"
            }];
            var expectedApprovalState = [{
                "dataSet": "170b8cd5e53",
                "period": "2014W20",
                "orgUnit": "c484c99b86d",
                "isApproved": true,
            }];
            httpBackend.expectPOST(properties.dhis.url + "/api/dataApprovals/bulk", approvalRequests).respond(500, "not ok");

            var approvalService = new ApprovalService(http, db);
            approvalService.approve(approvalRequests);
            httpBackend.flush();

            expect(db.objectStore).toHaveBeenCalledWith("approvals");
            expect(approvalStore.upsert).toHaveBeenCalledWith(expectedApprovalState);
        });
    });
});