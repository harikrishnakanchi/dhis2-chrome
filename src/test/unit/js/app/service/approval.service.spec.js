define(["approvalService", "angularMocks", "properties", "utils", "moment", "lodash"], function(ApprovalService, mocks, properties, utils, moment, _) {
    describe("approval service", function() {
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

            var _Date = Date;
            spyOn(window, 'Date').and.returnValue(new _Date("2014-05-30T12:43:54.972Z"));

            httpBackend.expectPOST(properties.dhis.url + "/api/completeDataSetRegistrations?cd=2014-05-30T12:43:54.972Z&ds=170b8cd5e53&multiOu=true&ou=17yugc&pe=2014W01&sb=testproj_approver_l1").respond(200, "ok");

            var approvalService = new ApprovalService(http, db, q);
            approvalService.markAsComplete(["170b8cd5e53"], "2014W01", "17yugc", "testproj_approver_l1", moment().toISOString());

            httpBackend.flush();

        });

        it("should mark data as complete in db", function() {

            var _Date = Date;
            spyOn(window, 'Date').and.returnValue(new _Date("2014-05-30T12:43:54.972Z"));

            var data = {
                dataSets: [],
                period: '2014W14',
                orgUnit: 'mod2',
                storedBy: 'dataentryuser',
                date: moment().toISOString()
            };

            var approvalService = new ApprovalService(http, db, q);
            approvalService.saveCompletionToDB(data);

            expect(mockStore.upsert).toHaveBeenCalledWith(data);

        });

        it("should get complete datasets", function() {
            var dataSets = ["170b8c", "d5e53"];
            var orgUnits = ["c484c9", "9b86d"];
            var endDate = moment().format("YYYY-MM-DD");

            httpBackend.expectGET(properties.dhis.url + "/api/completeDataSetRegistrations?children=true&dataSet=170b8c&dataSet=d5e53&endDate=" + endDate + "&orgUnit=c484c9&orgUnit=9b86d&startDate=1900-01-01").respond(200, "ok");

            approvalService = new ApprovalService(http, db, q);
            approvalService.getAllLevelOneApprovalData(orgUnits, dataSets);

            httpBackend.flush();
        });


        it("should get save complete datasets", function() {
            var completionRegistrationFor = function(dataSets, period, completedDate) {
                return _.map(dataSets, function(ds) {
                    return {
                        "dataSet": {
                            "id": ds,
                        },
                        "period": {
                            "id": period,
                        },
                        "organisationUnit": {
                            "id": "ou1",
                        },
                        "date": completedDate,
                        "storedBy": "testproj_approver_l1"
                    };
                });
            };

            var dataSets = ["d1", "d2", "d3"];
            var completeDataSetRegistrationList = [];
            completeDataSetRegistrationList = completeDataSetRegistrationList.concat(completionRegistrationFor(dataSets, "2014W01", moment("2010-01-01").toDate()));
            completeDataSetRegistrationList = completeDataSetRegistrationList.concat(completionRegistrationFor(dataSets, "2014W02", moment("2010-01-07").toDate()));

            var expectedData = [{
                "orgUnit": "ou1",
                "period": "2014W01",
                "storedBy": "testproj_approver_l1",
                "date": moment("2010-01-01").toDate(),
                "dataSets": ["d1", "d2", "d3"]
            }, {
                "orgUnit": "ou1",
                "period": "2014W02",
                "storedBy": "testproj_approver_l1",
                "date": moment("2010-01-07").toDate(),
                "dataSets": ["d1", "d2", "d3"]
            }];

            approvalService = new ApprovalService(http, db, q);
            approvalService.saveLevelOneApprovalData(completeDataSetRegistrationList);

            expect(db.objectStore).toHaveBeenCalledWith("completeDataSets");
            expect(mockStore.upsert).toHaveBeenCalledWith(expectedData);
        });
    });
});