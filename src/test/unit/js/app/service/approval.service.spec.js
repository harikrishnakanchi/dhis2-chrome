define(["approvalService", "angularMocks", "properties", "utils", "moment", "lodash"], function(ApprovalService, mocks, properties, utils, moment, _) {
    describe("approval service", function() {
        var http, httpBackend, db, q, mockStore, dataSets, orgUnits;

        beforeEach(mocks.inject(function($injector) {
            http = $injector.get('$http');
            q = $injector.get('$q');

            httpBackend = $injector.get('$httpBackend');

            var mockDB = utils.getMockDB(q);
            db = mockDB.db;
            mockStore = mockDB.objectStore;
            dataSets = ["d1", "d2"];
            orgUnits = ["ou1", "ou2"];
        }));

        afterEach(function() {
            httpBackend.verifyNoOutstandingExpectation();
            httpBackend.verifyNoOutstandingRequest();
        });

        it("should mark data as complete in dhis", function() {
            var _Date = Date;
            spyOn(window, 'Date').and.returnValue(new _Date("2014-05-30T12:43:54.972Z"));

            var expectedPayload = [{
                "ds": "170b8cd5e53",
                "pe": "2014W01",
                "ou": "17yugc",
                "sb": "testproj_approver_l1",
                "cd": "2014-05-30T12:43:54.972Z",
                "multiOu": true
            }, {
                "ds": "wqeb8cd5e53",
                "pe": "2014W01",
                "ou": "17yugc",
                "sb": "testproj_approver_l1",
                "cd": "2014-05-30T12:43:54.972Z",
                "multiOu": true
            }, {
                "ds": "170b8cd5e53",
                "pe": "2014W02",
                "ou": "17yugc",
                "sb": "testproj_approver_l1",
                "cd": "2014-05-30T12:43:54.972Z",
                "multiOu": true
            }, {
                "ds": "wqeb8cd5e53",
                "pe": "2014W02",
                "ou": "17yugc",
                "sb": "testproj_approver_l1",
                "cd": "2014-05-30T12:43:54.972Z",
                "multiOu": true
            }];

            httpBackend.expectPOST(properties.dhis.url + "/api/completeDataSetRegistrations/multiple", expectedPayload).respond(200, "ok");

            var periodsAndOrgUnits = [{
                "period": "2014W01",
                "orgUnit": "17yugc"
            }, {
                "period": "2014W02",
                "orgUnit": "17yugc"
            }];

            var approvalService = new ApprovalService(http, db, q);
            approvalService.markAsComplete(["170b8cd5e53", "wqeb8cd5e53"], periodsAndOrgUnits, "testproj_approver_l1", moment().toISOString());
            httpBackend.flush();
        });

        it("should mark data as approved in dhis", function() {

            var expectedPayload = [{
                "ds": "170b8cd5e53",
                "pe": "2014W01",
                "ou": "17yugc",
                "ab": "currentUserName",
                "ad": "2014-01-01"
            }, {
                "ds": "wqeb8cd5e53",
                "pe": "2014W01",
                "ou": "17yugc",
                "ab": "currentUserName",
                "ad": "2014-01-01"
            }, {
                "ds": "170b8cd5e53",
                "pe": "2014W02",
                "ou": "17yugc",
                "ab": "currentUserName",
                "ad": "2014-01-01"
            }, {
                "ds": "wqeb8cd5e53",
                "pe": "2014W02",
                "ou": "17yugc",
                "ab": "currentUserName",
                "ad": "2014-01-01"
            }];

            httpBackend.expectPOST(properties.dhis.url + "/api/dataApprovals/multiple", expectedPayload).respond(200, "ok");

            var periodsAndOrgUnits = [{
                "period": "2014W01",
                "orgUnit": "17yugc"
            }, {
                "period": "2014W02",
                "orgUnit": "17yugc"
            }];

            var approvalService = new ApprovalService(http, db, q);
            approvalService.markAsApproved(["170b8cd5e53", "wqeb8cd5e53"], periodsAndOrgUnits, "currentUserName", "2014-01-01");

            httpBackend.flush();
        });

        it("should get complete datasets", function() {
            var startDate = moment().subtract(properties.projectDataSync.numWeeksToSync, "week").format("YYYY-MM-DD");
            var endDate = moment().format("YYYY-MM-DD");

            var dhisApprovalData = {
                "completeDataSetRegistrations": [{
                    "dataSet": {
                        "id": "d1"
                    },
                    "period": {
                        "id": "2014W1"
                    },
                    "organisationUnit": {
                        "id": "ou1"
                    },
                    "date": "2014-01-03T00:00:00.000+0000",
                    "lastModifiedTime": "2014-01-03T00:00:00.000+0000",
                    "storedBy": "testproj_approver_l1"
                }, {
                    "dataSet": {
                        "id": "d2"
                    },
                    "period": {
                        "id": "2014W1"
                    },
                    "organisationUnit": {
                        "id": "ou1"
                    },
                    "date": "2014-01-03T00:00:00.000+0000",
                    "lastModifiedTime": "2014-01-03T00:00:00.000+0000",
                    "storedBy": "testproj_approver_l1"
                }, {
                    "dataSet": {
                        "id": "d1"
                    },
                    "period": {
                        "id": "2014W2"
                    },
                    "organisationUnit": {
                        "id": "ou1"
                    },
                    "date": "2014-01-10T00:00:00.000+0000",
                    "lastModifiedTime": "2014-01-10T00:00:00.000+0000",
                    "storedBy": "testproj_approver_l1"
                }, {
                    "dataSet": {
                        "id": "d2"
                    },
                    "period": {
                        "id": "2014W2"
                    },
                    "organisationUnit": {
                        "id": "ou1"
                    },
                    "date": "2014-01-10z",
                    "lastModifiedTime": "2014-01-10T00:00:00.000+0000",
                    "storedBy": "testproj_approver_l1"
                }]
            };

            httpBackend.expectGET(properties.dhis.url + "/api/completeDataSetRegistrations?children=true&dataSet=d1&dataSet=d2&endDate=" + endDate + "&orgUnit=ou1&orgUnit=ou2&startDate=" + startDate).respond(200, dhisApprovalData);

            var actualApprovalData;
            approvalService = new ApprovalService(http, db, q);
            approvalService.getAllLevelOneApprovalData(orgUnits, dataSets).then(function(data) {
                actualApprovalData = data;
            });

            httpBackend.flush();

            var expectedApprovalData = [{
                "period": "2014W01",
                "orgUnit": "ou1",
                "completedBy": "testproj_approver_l1",
                "completedOn": "2014-01-03T00:00:00.000+0000",
                "isComplete": true
            }, {
                "period": "2014W02",
                "orgUnit": "ou1",
                "completedBy": "testproj_approver_l1",
                "completedOn": "2014-01-10T00:00:00.000+0000",
                "isComplete": true
            }];

            expect(actualApprovalData).toEqual(expectedApprovalData);
        });

        it("should get level two approval data by considering the lowest approval level of associated datasets", function() {
            var startDate = moment().subtract(properties.projectDataSync.numWeeksToSync, "week").format("YYYY-MM-DD");
            var endDate = moment().format("YYYY-MM-DD");

            var dhisApprovalData = {
                "dataApprovalStateResponses": [{
                    "dataSet": {
                        "id": "d1"
                    },
                    "period": {
                        "id": "2014W1"
                    },
                    "organisationUnit": {
                        "id": "ou1"
                    },
                    "state": "APPROVED_ABOVE",
                    "createdByUsername": "msfadmin",
                    "createdDate": "2014-07-21T12:08:05.311+0000",
                    "mayApprove": false,
                    "mayUnapprove": false,
                    "mayAccept": false,
                    "mayUnaccept": false
                }, {
                    "dataSet": {
                        "id": "d2"
                    },
                    "period": {
                        "id": "2014W1"
                    },
                    "organisationUnit": {
                        "id": "ou1"
                    },
                    "state": "APPROVED_ABOVE",
                    "createdByUsername": "msfadmin",
                    "createdDate": "2014-07-21T12:08:05.311+0000",
                    "mayApprove": false,
                    "mayUnapprove": false,
                    "mayAccept": false,
                    "mayUnaccept": false
                }, {
                    "dataSet": {
                        "id": "d1"
                    },
                    "period": {
                        "id": "2014W2"
                    },
                    "organisationUnit": {
                        "id": "ou1"
                    },
                    "state": "APPROVED_HERE",
                    "createdByUsername": "msfadmin",
                    "createdDate": "2014-07-21T12:08:05.311+0000",
                    "mayApprove": true,
                    "mayUnapprove": true,
                    "mayAccept": true,
                    "mayUnaccept": true
                }, {
                    "dataSet": {
                        "id": "d1"
                    },
                    "period": {
                        "id": "2014W3"
                    },
                    "organisationUnit": {
                        "id": "ou1"
                    },
                    "state": "ACCEPTED_HERE",
                    "createdByUsername": "msfadmin",
                    "createdDate": "2014-07-21T12:08:05.311+0000",
                    "mayApprove": true,
                    "mayUnapprove": true,
                    "mayAccept": true,
                    "mayUnaccept": true
                }, {
                    "dataSet": {
                        "id": "d1"
                    },
                    "period": {
                        "id": "2014W4"
                    },
                    "organisationUnit": {
                        "id": "ou1"
                    },
                    "state": "ACCEPTED_HERE",
                    "createdByUsername": "msfadmin",
                    "createdDate": "2014-07-21T12:08:05.311+0000",
                    "mayApprove": true,
                    "mayUnapprove": true,
                    "mayAccept": true,
                    "mayUnaccept": true
                }, {
                    "dataSet": {
                        "id": "d1"
                    },
                    "period": {
                        "id": "2014W5"
                    },
                    "organisationUnit": {
                        "id": "ou1"
                    },
                    "state": "UNAPPROVABLE",
                    "mayApprove": true,
                    "mayUnapprove": true,
                    "mayAccept": true,
                    "mayUnaccept": true
                }, {
                    "dataSet": {
                        "id": "d2"
                    },
                    "period": {
                        "id": "2014W5"
                    },
                    "organisationUnit": {
                        "id": "ou1"
                    },
                    "state": "UNAPPROVED_READY",
                    "createdByUsername": "msfadmin",
                    "createdDate": "2014-07-21T12:08:05.311+0000",
                    "mayApprove": true,
                    "mayUnapprove": true,
                    "mayAccept": true,
                    "mayUnaccept": true
                }]
            };

            httpBackend.expectGET(properties.dhis.url + "/api/dataApprovals/status?children=true&ds=d1&ds=d2&endDate=" + endDate + "&ou=ou1&ou=ou2&pe=Weekly&startDate=" + startDate).respond(200, dhisApprovalData);

            var actualApprovalData;
            approvalService = new ApprovalService(http, db, q);
            approvalService.getAllLevelTwoApprovalData(orgUnits, dataSets).then(function(data) {
                actualApprovalData = data;
            });

            httpBackend.flush();

            var expectedApprovalData = [{
                "period": "2014W01",
                "orgUnit": "ou1",
                "approvedBy": "msfadmin",
                "approvedOn": "2014-07-21T12:08:05.311+0000",
                "isApproved": true
            }, {
                "period": "2014W02",
                "orgUnit": "ou1",
                "approvedBy": "msfadmin",
                "approvedOn": "2014-07-21T12:08:05.311+0000",
                "isApproved": true
            }, {
                "period": "2014W03",
                "orgUnit": "ou1",
                "approvedBy": "msfadmin",
                "approvedOn": "2014-07-21T12:08:05.311+0000",
                "isApproved": true
            }, {
                "period": "2014W04",
                "orgUnit": "ou1",
                "approvedBy": "msfadmin",
                "approvedOn": "2014-07-21T12:08:05.311+0000",
                "isApproved": true
            }];

            expect(actualApprovalData).toEqual(expectedApprovalData);
        });

        it("should return a failure http promise if download approval level two data fails", function() {
            httpBackend.expectGET().respond(500, {});
            approvalService = new ApprovalService(http, db, q);

            var status;
            approvalService.getAllLevelTwoApprovalData(orgUnits, dataSets).then(undefined, function(data) {
                status = data.status;
            });

            httpBackend.flush();

            expect(status).toBe(500);
        });

        it("should return a failure http promise if download all data fails", function() {
            httpBackend.expectGET().respond(500, {});
            approvalService = new ApprovalService(http, db, q);

            var status;
            approvalService.getAllLevelOneApprovalData(orgUnits, dataSets).then(undefined, function(data) {
                status = data.status;
            });

            httpBackend.flush();

            expect(status).toBe(500);
        });

        it("should mark data as incomplete in dhis", function() {
            httpBackend.expectDELETE(properties.dhis.url + "/api/completeDataSetRegistrations?ds=170b8cd5e53&multiOu=true&ou=17yugc&pe=2014W01")
                .respond(200, "ok");

            var approvalService = new ApprovalService(http, db, q);
            approvalService.markAsIncomplete(["170b8cd5e53"], "2014W01", "17yugc");

            httpBackend.flush();
        });

        it("should mark data as unapproved in dhis", function() {
            httpBackend.expectDELETE(properties.dhis.url + "/api/dataApprovals?ds=170b8cd5e53&ou=17yugc&pe=2014W01").respond(200, "ok");

            var approvalService = new ApprovalService(http, db, q);
            approvalService.markAsUnapproved(["170b8cd5e53"], "2014W01", "17yugc");

            httpBackend.flush();
        });
    });
});
