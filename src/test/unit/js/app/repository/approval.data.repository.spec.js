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

        it("should save complete datasets", function() {
            var completeDataSetRegistrationList = [{
                "orgUnit": "ou1",
                "period": "2014W1",
                "storedBy": "testproj_approver_l1",
                "date": "2014-01-03T00:00:00.000+0000",
                "dataSets": ["d1", "d2", "d3"]
            }, {
                "orgUnit": "ou1",
                "period": "2014W02",
                "storedBy": "testproj_approver_l1",
                "date": "2014-01-03T00:00:00.000+0000",
                "dataSets": ["d1", "d2", "d3"]
            }];

            approvalDataRepository.saveLevelOneApproval(completeDataSetRegistrationList);

            expect(db.objectStore).toHaveBeenCalledWith("completedData");

            expect(mockStore.upsert).toHaveBeenCalledWith(completeDataSetRegistrationList);
            expect(mockStore.upsert.calls.argsFor(0)[0][0].period).toEqual("2014W01");
            expect(mockStore.upsert.calls.argsFor(0)[0][1].period).toEqual("2014W02");
        });

        it("should delete complete registrations", function() {
            approvalDataRepository.deleteLevelOneApproval("2014W1", "ou1");

            expect(db.objectStore).toHaveBeenCalledWith("completedData");
            expect(mockStore.delete).toHaveBeenCalledWith(["2014W01", "ou1"]);
        });

        it("should delete approval", function() {
            approvalDataRepository.deleteLevelTwoApproval("2014W1", "ou1");

            expect(db.objectStore).toHaveBeenCalledWith("approvedData");
            expect(mockStore.delete).toHaveBeenCalledWith(["2014W01", "ou1"]);
        });

        it("should save approvals", function() {
            var approvedDataSets = [{
                "orgUnit": "ou1",
                "period": "2014W1",
                "dataSets": ["d1", "d2", "d3"]
            }, {
                "orgUnit": "ou1",
                "period": "2014W02",
                "dataSets": ["d1", "d2", "d3"]
            }];

            approvalDataRepository.saveLevelTwoApproval(approvedDataSets);

            expect(db.objectStore).toHaveBeenCalledWith("approvedData");

            expect(mockStore.upsert).toHaveBeenCalledWith(approvedDataSets);
            expect(mockStore.upsert.calls.argsFor(0)[0][0].period).toEqual("2014W01");
            expect(mockStore.upsert.calls.argsFor(0)[0][1].period).toEqual("2014W02");
        });

        it("should get level two approval data", function() {
            var data = {
                "period": "2014W05",
                "orgUnit": "orgUnitId",
                "isComplete": true,
                "isApproved": true
            };

            var result;

            mockStore.find.and.returnValue(utils.getPromise(q, data));

            approvalDataRepository.getLevelTwoApprovalData('2014W5', 'orgUnitId').then(function(payload) {
                result = payload;
            });

            scope.$apply();

            expect(result).toEqual(data);
        });

        it("should get the filtered approval data", function() {
            mockStore.find.and.returnValue(utils.getPromise(q, {
                period: '2014W15',
                status: 'DELETED'
            }));

            approvalDataRepository.getApprovalData('period', 'orgUnitId', true).then(function(data) {
                expect(data).toBeUndefined();
            });

            scope.$apply();
        });

        it("should get the approval data", function() {
            mockStore.find.and.returnValue(utils.getPromise(q, {
                period: '2014W05'
            }));

            approvalDataRepository.getApprovalData('2014W5', 'orgUnitId');

            expect(db.objectStore).toHaveBeenCalledWith("approvals");
            expect(mockStore.find).toHaveBeenCalledWith(['2014W05', 'orgUnitId']);
        });

        it("should get the complete data values", function() {
            var approvalData = {
                "period": '2014W05',
                "isComplete": 'true',
                "isApproved": false
            };
            mockStore.find.and.returnValue(utils.getPromise(q, approvalData));

            var actualApprovalData;
            approvalDataRepository.getLevelOneApprovalData('2014W5', 'orgUnitId', true).then(function(data) {
                actualApprovalData = data;
            });
            scope.$apply();

            expect(mockStore.find).toHaveBeenCalledWith(['2014W05', 'orgUnitId']);
            expect(actualApprovalData).toEqual(approvalData);
        });

        it("should get the complete data values and filter out deleted approvals", function() {
            var approvalData;
            mockStore.find.and.returnValue(utils.getPromise(q, {
                "period": '2014W05',
                "isComplete": true,
                "status": "DELETED"
            }));

            approvalDataRepository.getLevelOneApprovalData('2014W5', 'orgUnitId', true).then(function(data) {
                approvalData = data;
            });
            scope.$apply();
            expect(approvalData).toBe(undefined);
        });

        it("should get data values by periods and orgunits", function() {
            mockStore.each.and.returnValue(utils.getPromise(q, [{
                "orgUnit": "ou1",
                "period": "2014W01",
                "completedBy": "testproj_approver_l1",
                "isComplete": true,
                "date": "2014-01-03T00:00:00.000+0000",
            }, {
                "orgUnit": "ou1",
                "period": "2014W02",
                "completedBy": "testproj_approver_l1",
                "isComplete": true,
                "date": "2014-01-03T00:00:00.000+0000",
            }, {
                "orgUnit": "ou3",
                "period": "2014W01",
                "completedBy": "testproj_approver_l1",
                "isComplete": true,
                "date": "2014-01-03T00:00:00.000+0000",
            }]));

            var actualDataValues;
            approvalDataRepository.getLevelOneApprovalDataForPeriodsOrgUnits("2014W01", "2014W02", ["ou1", "ou2"]).then(function(approvalData) {
                actualDataValues = approvalData;
            });

            scope.$apply();

            expect(actualDataValues).toEqual([{
                "orgUnit": "ou1",
                "period": "2014W01",
                "completedBy": "testproj_approver_l1",
                "date": "2014-01-03T00:00:00.000+0000",
                "isComplete": true
            }, {
                "orgUnit": "ou1",
                "period": "2014W02",
                "completedBy": "testproj_approver_l1",
                "date": "2014-01-03T00:00:00.000+0000",
                "isComplete": true
            }]);
        });

        it("should get level two approval data by periods and orgunits", function() {
            mockStore.each.and.returnValue(utils.getPromise(q, [{
                "orgUnit": "ou1",
                "period": "2014W01",
                "createdByUsername": "testproj_approver_l1",
                "createdDate": "2014-01-03T00:00:00.000+0000",
                "dataSets": ["d1", "d2", "d3"],
                "isAccepted": true,
                "isApproved": true
            }, {
                "orgUnit": "ou1",
                "period": "2014W02",
                "createdByUsername": "testproj_approver_l1",
                "createdDate": "2014-01-03T00:00:00.000+0000",
                "dataSets": ["d1", "d2", "d3"],
                "isAccepted": false,
                "isApproved": true
            }, {
                "orgUnit": "ou2",
                "period": "2014W02",
                "createdByUsername": "testproj_approver_l1",
                "createdDate": "2014-01-03T00:00:00.000+0000",
                "dataSets": ["d1", "d2", "d3"],
                "isAccepted": false,
                "isApproved": true
            }, {
                "orgUnit": "ou3",
                "period": "2014W01",
                "createdByUsername": "testproj_approver_l1",
                "createdDate": "2014-01-03T00:00:00.000+0000",
                "dataSets": ["d1", "d2", "d3"],
                "isAccepted": false,
                "isApproved": true
            }]));

            var actualDataValues;
            approvalDataRepository.getLevelTwoApprovalDataForPeriodsOrgUnits("2014W01", "2014W02", ["ou1", "ou2"]).then(function(approvalData) {
                actualDataValues = approvalData;
            });

            scope.$apply();

            expect(actualDataValues).toEqual([{
                "orgUnit": "ou1",
                "period": "2014W01",
                "createdByUsername": "testproj_approver_l1",
                "createdDate": "2014-01-03T00:00:00.000+0000",
                "dataSets": ["d1", "d2", "d3"],
                "isAccepted": true,
                "isApproved": true
            }, {
                "orgUnit": "ou1",
                "period": "2014W02",
                "createdByUsername": "testproj_approver_l1",
                "createdDate": "2014-01-03T00:00:00.000+0000",
                "dataSets": ["d1", "d2", "d3"],
                "isAccepted": false,
                "isApproved": true
            }, {
                "orgUnit": "ou2",
                "period": "2014W02",
                "createdByUsername": "testproj_approver_l1",
                "createdDate": "2014-01-03T00:00:00.000+0000",
                "dataSets": ["d1", "d2", "d3"],
                "isAccepted": false,
                "isApproved": true
            }]);
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
                "isAccepted": false,
                "status": "NEW"
            }, {
                "period": "2014W01",
                "orgUnit": "Mod2",
                "completedBy": "user",
                "completedOn": "2014-01-03T00:00:00.000Z",
                "isComplete": true,
                "isApproved": false,
                "isAccepted": false,
                "status": "NEW"
            }, {
                "period": "2014W02",
                "orgUnit": "Mod1",
                "completedBy": "user",
                "completedOn": "2014-01-03T00:00:00.000Z",
                "isComplete": true,
                "isApproved": false,
                "isAccepted": false,
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
                "isAccepted": false
            }, {
                "period": "2014W01",
                "orgUnit": "Mod2",
                "completedBy": "user1",
                "completedOn": "2014-01-01T00:00:00.000Z",
                "isComplete": true,
                "isApproved": false,
                "isAccepted": false
            }, {
                "period": "2014W01",
                "orgUnit": "Mod3",
                "completedBy": "user1",
                "completedOn": "2014-01-01T00:00:00.000Z",
                "isComplete": true,
                "isApproved": false,
                "isAccepted": false
            }, {
                "period": "2014W02",
                "orgUnit": "Mod1",
                "completedBy": "user1",
                "completedOn": "2014-01-01T00:00:00.000Z",
                "isComplete": true,
                "isApproved": false,
                "isAccepted": false,
                "status": "NEW"
            }, {
                "period": "2014W02",
                "orgUnit": "Mod4",
                "completedBy": "user1",
                "completedOn": "2014-01-01T00:00:00.000Z",
                "isComplete": true,
                "isApproved": false,
                "isAccepted": false,
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
                "isAccepted": false,
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
                "isAccepted": false,
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
                "isAccepted": false,
                "status": "NEW"
            }];

            mockStore.each.and.returnValue(utils.getPromise(q, approvalsInIdb));

            approvalDataRepository.markAsApproved(periodsAndOrgUnits, "user3");
            scope.$apply();

            expect(db.objectStore).toHaveBeenCalledWith("approvals");
            expect(mockStore.upsert).toHaveBeenCalledWith(expectedUpserts);
        });

        it("should mark all period and orgunit combinations as accepted while retaining existing completion info", function() {
            var periodsAndOrgUnits = [{
                "period": "2014W01",
                "orgUnit": "Mod1"
            }, {
                "period": "2014W01",
                "orgUnit": "Mod2"
            }, {
                "period": "2014W02",
                "orgUnit": "Mod4"
            }];

            var approvalsInIdb = [{
                "period": "2014W01",
                "orgUnit": "Mod1",
                "completedBy": "user1",
                "completedOn": "2014-01-01T00:00:00.000Z",
                "approvedBy": "user2",
                "approvedOn": "2014-02-04T00:00:00.000Z",
                "isComplete": true,
                "isApproved": true,
                "isAccepted": false,
                "status": "NEW"
            }, {
                "period": "2014W01",
                "orgUnit": "Mod2",
                "completedBy": "user1",
                "completedOn": "2014-01-01T00:00:00.000Z",
                "isComplete": true,
                "isApproved": true,
                "isAccepted": false
            }, {
                "period": "2014W01",
                "orgUnit": "Mod3",
                "completedBy": "user1",
                "completedOn": "2014-01-01T00:00:00.000Z",
                "isComplete": true,
                "isApproved": true,
                "isAccepted": false
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
                "isAccepted": true,
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
                "isAccepted": true,
                "status": "NEW"
            }, {
                "period": "2014W02",
                "orgUnit": "Mod4",
                "completedBy": "user3",
                "completedOn": thisMoment.toISOString(),
                "approvedBy": "user3",
                "approvedOn": thisMoment.toISOString(),
                "isComplete": true,
                "isApproved": true,
                "isAccepted": true,
                "status": "NEW"
            }];

            mockStore.each.and.returnValue(utils.getPromise(q, approvalsInIdb));

            approvalDataRepository.markAsAccepted(periodsAndOrgUnits, "user3");
            scope.$apply();

            expect(db.objectStore).toHaveBeenCalledWith("approvals");
            expect(mockStore.upsert).toHaveBeenCalledWith(expectedUpserts);
        });

        it("should mark as accepted during auto approve", function() {
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

            var approvalsInIdb = [];


            var expectedUpserts = [{
                "period": "2014W01",
                "orgUnit": "Mod1",
                "completedBy": "user3",
                "completedOn": thisMoment.toISOString(),
                "approvedBy": "user3",
                "approvedOn": thisMoment.toISOString(),
                "isComplete": true,
                "isApproved": true,
                "isAccepted": true,
                "status": "NEW"
            }, {
                "period": "2014W01",
                "orgUnit": "Mod2",
                "completedBy": "user3",
                "completedOn": thisMoment.toISOString(),
                "approvedBy": "user3",
                "approvedOn": thisMoment.toISOString(),
                "isComplete": true,
                "isApproved": true,
                "isAccepted": true,
                "status": "NEW"
            }, {
                "period": "2014W02",
                "orgUnit": "Mod1",
                "completedBy": "user3",
                "completedOn": thisMoment.toISOString(),
                "approvedBy": "user3",
                "approvedOn": thisMoment.toISOString(),
                "isComplete": true,
                "isApproved": true,
                "isAccepted": true,
                "status": "NEW"
            }];

            mockStore.each.and.returnValue(utils.getPromise(q, approvalsInIdb));

            approvalDataRepository.markAsAccepted(periodsAndOrgUnits, "user3");
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
                "isAccepted": false,
                "status": "DELETED"
            }, {
                "period": "2014W01",
                "orgUnit": "Mod2",
                "isComplete": false,
                "isApproved": false,
                "isAccepted": false,
                "status": "DELETED"
            }, {
                "period": "2014W02",
                "orgUnit": "Mod1",
                "isComplete": false,
                "isApproved": false,
                "isAccepted": false,
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

    });
});