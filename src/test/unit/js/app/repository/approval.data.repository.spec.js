define(["approvalDataRepository", "angularMocks", "utils", "timecop", "moment"], function(ApprovalDataRepository, mocks, utils, timecop, moment) {
    describe("approval data repo", function() {
        var approvalDataRepository, q, scope;

        beforeEach(mocks.inject(function($injector) {
            q = $injector.get('$q');
            scope = $injector.get("$rootScope");
            thisMoment = moment("2014-01-03T00:00:00.000+0000");

            var mockDB = utils.getMockDB(q);
            db = mockDB.db;
            mockStore = mockDB.objectStore;

            Timecop.install();
            Timecop.freeze(thisMoment.toDate());

            approvalDataRepository = new ApprovalDataRepository(db, q);
        }));

        afterEach(function() {
            Timecop.returnToPresent();
            Timecop.uninstall();
        });

        it("should get the approval data", function() {
            mockStore.find.and.returnValue(utils.getPromise(q, {
                period: '2014W05'
            }));

            approvalDataRepository.getApprovalData({
                'period': '2014W5',
                'orgUnit': 'orgUnitId'
            });

            expect(db.objectStore).toHaveBeenCalledWith("approvals");
            expect(mockStore.find).toHaveBeenCalledWith(['2014W05', 'orgUnitId']);
        });

        it("should mark as complete", function() {
            var periodsAndOrgUnits = [{
                "period": "2014W1",
                "orgUnit": "Mod1"
            }, {
                "period": "2014W1",
                "orgUnit": "Mod2"
            }, {
                "period": "2014W2",
                "orgUnit": "Mod1"
            }];

            approvalDataRepository.markAsComplete(periodsAndOrgUnits, "user");

            var expectedUpserts = [{
                "period": "2014W01",
                "orgUnit": "Mod1",
                "completedBy": "user",
                "completedOn": "2014-01-03T00:00:00.000Z",
                "isComplete": true,
                "isApproved": false,
                "status": "NEW"
            }, {
                "period": "2014W01",
                "orgUnit": "Mod2",
                "completedBy": "user",
                "completedOn": "2014-01-03T00:00:00.000Z",
                "isComplete": true,
                "isApproved": false,
                "status": "NEW"
            }, {
                "period": "2014W02",
                "orgUnit": "Mod1",
                "completedBy": "user",
                "completedOn": "2014-01-03T00:00:00.000Z",
                "isComplete": true,
                "isApproved": false,
                "status": "NEW"
            }];

            expect(db.objectStore).toHaveBeenCalledWith("approvals");
            expect(mockStore.upsert).toHaveBeenCalledWith(expectedUpserts);
        });

        it("should mark only existing completions as approved while retaining existing completion info", function() {
            var periodsAndOrgUnits = [{
                "period": "2014W01",
                "orgUnit": "Mod1"
            }, {
                "period": "2014W01",
                "orgUnit": "Mod2"
            }, {
                "period": "2014W02",
                "orgUnit": "Mod4"
            }, {
                "period": "2014W02",
                "orgUnit": "Mod5"
            }];

            var approvalsInIdb = [{
                "period": "2014W01",
                "orgUnit": "Mod1",
                "completedBy": "user1",
                "completedOn": "2014-01-01T00:00:00.000Z",
                "isComplete": true,
                "isApproved": false,
            }, {
                "period": "2014W01",
                "orgUnit": "Mod2",
                "completedBy": "user1",
                "completedOn": "2014-01-01T00:00:00.000Z",
                "isComplete": true,
                "isApproved": false,
            }, {
                "period": "2014W01",
                "orgUnit": "Mod3",
                "completedBy": "user1",
                "completedOn": "2014-01-01T00:00:00.000Z",
                "isComplete": true,
                "isApproved": false,
            }, {
                "period": "2014W02",
                "orgUnit": "Mod1",
                "completedBy": "user1",
                "completedOn": "2014-01-01T00:00:00.000Z",
                "isComplete": true,
                "isApproved": false,
                "status": "NEW"
            }, {
                "period": "2014W02",
                "orgUnit": "Mod4",
                "completedBy": "user1",
                "completedOn": "2014-01-01T00:00:00.000Z",
                "isComplete": true,
                "isApproved": false,
                "status": "NEW"
            }];

            var expectedUpserts = [{
                "period": "2014W01",
                "orgUnit": "Mod1",
                "completedBy": "user1",
                "completedOn": "2014-01-01T00:00:00.000Z",
                "approvedBy": "user3",
                "approvedOn": thisMoment.toISOString(),
                "isComplete": true,
                "isApproved": true,
                "status": "NEW"
            }, {
                "period": "2014W01",
                "orgUnit": "Mod2",
                "completedBy": "user1",
                "completedOn": "2014-01-01T00:00:00.000Z",
                "approvedBy": "user3",
                "approvedOn": thisMoment.toISOString(),
                "isComplete": true,
                "isApproved": true,
                "status": "NEW"
            }, {
                "period": "2014W02",
                "orgUnit": "Mod4",
                "completedBy": "user1",
                "completedOn": "2014-01-01T00:00:00.000Z",
                "approvedBy": "user3",
                "approvedOn": thisMoment.toISOString(),
                "isComplete": true,
                "isApproved": true,
                "status": "NEW"
            }, {
                "period": "2014W02",
                "orgUnit": "Mod5",
                "completedBy": "user3",
                "completedOn": thisMoment.toISOString(),
                "approvedBy": "user3",
                "approvedOn": thisMoment.toISOString(),
                "isComplete": true,
                "isApproved": true,
                "status": "NEW"
            }];

            mockStore.each.and.returnValue(utils.getPromise(q, approvalsInIdb));

            approvalDataRepository.markAsApproved(periodsAndOrgUnits, "user3");
            scope.$apply();

            expect(db.objectStore).toHaveBeenCalledWith("approvals");
            expect(mockStore.upsert).toHaveBeenCalledWith(expectedUpserts);
        });

        it("should reset approval", function() {
            var periodsAndOrgUnits = [{
                "period": "2014W1",
                "orgUnit": "Mod1"
            }, {
                "period": "2014W1",
                "orgUnit": "Mod2"
            }, {
                "period": "2014W2",
                "orgUnit": "Mod1"
            }];

            approvalDataRepository.clearApprovals(periodsAndOrgUnits);

            var expectedUpserts = [{
                "period": "2014W01",
                "orgUnit": "Mod1",
                "isComplete": false,
                "isApproved": false,
                "status": "DELETED"
            }, {
                "period": "2014W01",
                "orgUnit": "Mod2",
                "isComplete": false,
                "isApproved": false,
                "status": "DELETED"
            }, {
                "period": "2014W02",
                "orgUnit": "Mod1",
                "isComplete": false,
                "isApproved": false,
                "status": "DELETED"
            }];

            expect(db.objectStore).toHaveBeenCalledWith("approvals");
            expect(mockStore.upsert).toHaveBeenCalledWith(expectedUpserts);
        });

        it("should invalidate an approval if the data it has approved has changed due to a sync merge", function() {
            approvalDataRepository.invalidateApproval("2014W1", "ou1");

            expect(db.objectStore).toHaveBeenCalledWith("approvals");
            expect(mockStore.delete).toHaveBeenCalledWith(["2014W01", "ou1"]);
        });

        it("should save data from dhis", function() {

            var dataFromDhis = {
                "period": "2014W01",
                "orgUnit": "Mod1",
                "completedBy": "user1",
                "completedOn": "2014-01-10T00:00:00.000Z",
                "isComplete": true,
                "approvedBy": "user2",
                "approvedOn": "2014-01-10T00:00:00.000Z",
                "isApproved": true
            };

            approvalDataRepository.saveApprovalsFromDhis(dataFromDhis);

            expect(db.objectStore).toHaveBeenCalledWith("approvals");
            expect(mockStore.upsert).toHaveBeenCalledWith(dataFromDhis);
        });
    });
});
