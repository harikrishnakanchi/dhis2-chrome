define(["approvalService", "angularMocks", "properties", "utils", "moment"], function(ApprovalService, mocks, properties, utils, moment) {
    describe("dataService", function() {
        var http, httpBackend, db, q, mockStore;

        beforeEach(mocks.inject(function($injector) {
            http = $injector.get('$http');
            q = $injector.get('$q');

            httpBackend = $injector.get('$httpBackend');

            var mockDB = utils.getMockDB(q);
            db = mockDB.db;
            mockStore = mockDB.objectStore;
        }));

        afterEach(function() {
            httpBackend.verifyNoOutstandingExpectation();
            httpBackend.verifyNoOutstandingRequest();
        });

        it("should mark data as complete in dhis", function() {
            var approvalRequests = [{
                "dataSet": "170b8cd5e53",
                "period": "2014W20",
                "orgUnit": "c484c99b86d",
                "categoryCombination": null,
                "categoryOption": null,
                "multipleOrgUnits": false
            }];

            httpBackend.expectPOST(properties.dhis.url + "/api/completeDataSetRegistrations/bulk", approvalRequests).respond(200, "ok");

            var approvalService = new ApprovalService(http, db);
            approvalService.complete(approvalRequests);

            httpBackend.flush();
        });

        it("should get complete datasets", function() {
            var dataSets = ["170b8c", "d5e53"];
            var orgUnits = ["c484c9", "9b86d"];
            var endDate = moment().format("YYYY-MM-DD");

            httpBackend.expectGET(properties.dhis.url + "/api/completeDataSetRegistrations?children=true&dataSet=170b8c&dataSet=d5e53&endDate=" + endDate + "&orgUnit=c484c9&orgUnit=9b86d&startDate=1900-01-01").respond(200, "ok");

            approvalService = new ApprovalService(http, db);
            approvalService.getAllLevelOneApprovalData(orgUnits, dataSets);

            httpBackend.flush();
        });


        it("should get save complete datasets", function() {
            var approvalDate = moment("2010-01-01").toDate();
            var payload = {
                "completeDataSetRegistrationList": [{
                    "dataSet": {
                        "id": "d1",
                    },
                    "period": {
                        "id": "2014W01",
                    },
                    "organisationUnit": {
                        "id": "ou1",
                    },
                    "date": approvalDate,
                    "storedBy": "testproj_approver_l1"
                }, {
                    "dataSet": {
                        "id": "d2",
                    },
                    "period": {
                        "id": "2014W01",
                    },
                    "organisationUnit": {
                        "id": "ou1",
                    },
                    "date": approvalDate,
                    "storedBy": "testproj_approver_l1"
                }, {
                    "dataSet": {
                        "id": "d3",
                    },
                    "period": {
                        "id": "2014W01",
                    },
                    "organisationUnit": {
                        "id": "ou1",
                    },
                    "date": approvalDate,
                    "storedBy": "testproj_approver_l1"
                }]
            };

            var data = {
                "orgUnit": "ou1",
                "period": "2014W01",
                "storedBy": "testproj_approver_l1",
                "date": approvalDate,
                "dataSets": ["d1", "d2", "d3", ]
            };

            approvalService = new ApprovalService(http, db);
            approvalService.saveLevelOneApprovalData(payload);

            expect(db.objectStore).toHaveBeenCalledWith("completeDataSets");
            expect(mockStore.upsert).toHaveBeenCalledWith(data);
        });
    });
});